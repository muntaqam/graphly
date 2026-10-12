"use client";

/**
 * Editor state in one hook, so components stay presentational.
 *
 *   form (strings) → parseGraphForm → config? → buildGraphModel → model
 *
 * `lastValid` is the key UX decision: while a field is invalid (e.g. the
 * teacher has typed "-" on the way to "-5"), the preview keeps the last good
 * graph instead of flashing empty or crashing.
 *
 * Form, parse result and last valid config are updated together in a single
 * state transition (`next`), so render stays pure and they can never drift
 * out of sync.
 */

import { useCallback, useMemo, useState } from "react";
import {
  buildGraphModel,
  DEFAULT_CONFIG,
  formatNumber,
  formFromConfig,
  parseGraphForm,
  parseNumber,
  type FieldErrors,
  type GraphConfig,
  type GraphForm,
  type Visibility,
} from "@/lib/graph";

interface EditorState {
  form: GraphForm;
  errors: FieldErrors;
  lastValid: GraphConfig;
}

function next(prev: EditorState, form: GraphForm): EditorState {
  if (form === prev.form) return prev;
  const { config, errors } = parseGraphForm(form);
  return { form, errors, lastValid: config ?? prev.lastValid };
}

function initState(c: GraphConfig): EditorState {
  return { form: formFromConfig(c), errors: {}, lastValid: c };
}

export function useGraphEditor(initial: GraphConfig = DEFAULT_CONFIG) {
  const [state, setState] = useState<EditorState>(() => initState(initial));
  const update = useCallback(
    (fn: (f: GraphForm) => GraphForm) => setState((s) => next(s, fn(s.form))),
    [],
  );

  const model = useMemo(() => buildGraphModel(state.lastValid), [state.lastValid]);

  const setField = useCallback(
    <K extends keyof GraphForm>(key: K, value: GraphForm[K]) =>
      update((f) => ({ ...f, [key]: value })),
    [update],
  );

  const setShow = useCallback(
    (key: keyof Visibility, value: boolean) =>
      update((f) => ({ ...f, show: { ...f.show, [key]: value } })),
    [update],
  );

  /**
   * "Number of squares" is not stored separately: it is (max − min) / gridStep.
   * Storing both would let them disagree. Editing the count rewrites the grid
   * spacing instead. Returns false if the input isn't a usable count.
   */
  const setSquares = useCallback(
    (axis: "x" | "y", raw: string): boolean => {
      const count = parseNumber(raw);
      if (count === null || count < 1 || !Number.isInteger(count)) return false;
      const min = parseNumber(state.form[`${axis}Min`]);
      const max = parseNumber(state.form[`${axis}Max`]);
      if (min === null || max === null || max <= min) return false;
      const step = formatNumber(Number(((max - min) / count).toPrecision(10)));
      update((f) => ({ ...f, [`${axis}GridStep`]: step }));
      return true;
    },
    [state.form, update],
  );

  const load = useCallback((c: GraphConfig) => setState(initState(c)), []);
  const reset = useCallback(() => load(DEFAULT_CONFIG), [load]);

  return {
    form: state.form,
    errors: state.errors,
    hasErrors: Object.keys(state.errors).length > 0,
    /** The config currently drawn (the last valid one). */
    config: state.lastValid,
    model,
    setField,
    setShow,
    setSquares,
    load,
    reset,
  };
}

export type GraphEditor = ReturnType<typeof useGraphEditor>;
