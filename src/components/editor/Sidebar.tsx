"use client";

import type { GraphEditor } from "@/hooks/useGraphEditor";
import { formatNumber, type NumericField } from "@/lib/graph";
import { CommitInput, FieldRow, NumberInput, Section, Segmented, TextInput, Toggle } from "./fields";

type AxisRow = {
  label: string;
  hint?: string;
  field: "Min" | "Max" | "GridStep" | "LabelStep";
};

const AXIS_ROWS: AxisRow[] = [
  { label: "From", field: "Min" },
  { label: "To", field: "Max" },
  { label: "Grid line every", field: "GridStep" },
  { label: "Number every", field: "LabelStep" },
];

function AxisTable({ editor }: { editor: GraphEditor }) {
  const { form, errors, setField, config, setSquares } = editor;
  const squares = (a: "x" | "y") => {
    const ax = config[a];
    return formatNumber(Number(((ax.max - ax.min) / ax.gridStep).toPrecision(10)));
  };

  return (
    <div className="grid grid-cols-[1fr_5.25rem_5.25rem] items-start gap-x-2 gap-y-2">
      <span />
      <span className="text-center font-serif text-lg italic text-ink">x</span>
      <span className="text-center font-serif text-lg italic text-ink">y</span>

      {AXIS_ROWS.map((row) => (
        <div key={row.field} className="contents">
          <span className="pt-2 text-[0.95rem] text-ink">{row.label}</span>
          {(["x", "y"] as const).map((a) => {
            const f = `${a}${row.field}` as NumericField;
            return (
              <NumberInput
                key={f}
                label={`${a} ${row.label.toLowerCase()}`}
                testId={`field-${f}`}
                value={form[f]}
                error={errors[f]}
                onChange={(v) => setField(f, v)}
              />
            );
          })}
        </div>
      ))}

      <span className="pt-2 text-[0.95rem] text-ink">
        Squares
        <span className="block text-[0.8rem] leading-tight text-muted">Sets grid spacing</span>
      </span>
      {(["x", "y"] as const).map((a) => (
        <CommitInput
          key={a}
          label={`Number of ${a} squares`}
          testId={`field-${a}Squares`}
          value={squares(a)}
          onCommit={(v) => setSquares(a, v)}
        />
      ))}

      <span className="pt-2 text-[0.95rem] text-ink">Axis title</span>
      <TextInput label="x-axis title" testId="field-xTitle" value={form.xTitle} onChange={(v) => setField("xTitle", v)} />
      <TextInput label="y-axis title" testId="field-yTitle" value={form.yTitle} onChange={(v) => setField("yTitle", v)} />
    </div>
  );
}

function Num({ editor, field, label, hint, suffix }: { editor: GraphEditor; field: NumericField; label: string; hint?: string; suffix: string }) {
  return (
    <FieldRow label={label} htmlHint={hint}>
      <NumberInput
        label={label}
        testId={`field-${field}`}
        value={editor.form[field]}
        error={editor.errors[field]}
        suffix={suffix}
        onChange={(v) => editor.setField(field, v)}
      />
    </FieldRow>
  );
}

export function Sidebar({ editor }: { editor: GraphEditor }) {
  const { form, setField, setShow } = editor;
  const s = form.show;

  return (
    <div className="pb-8">
      <Section title="Axes and grid">
        <AxisTable editor={editor} />
      </Section>

      <Section title="Printed size">
        <Num editor={editor} field="widthIn" label="Width" suffix="in" />
        <Num editor={editor} field="heightIn" label="Height" suffix="in" />
        <div className="mt-3">
          <Segmented
            label="Grid shape"
            testId="cell-shape"
            value={form.cellShape}
            onChange={(v) => setField("cellShape", v)}
            options={[
              { value: "square", label: "Square cells" },
              { value: "fill", label: "Fill the size" },
            ]}
          />
          <p className="mt-2 text-[0.82rem] leading-snug text-muted">
            {form.cellShape === "square"
              ? "Every grid square is a true square. The grid is centered and may not use the full width or height."
              : "The grid stretches to the full size. Squares may become rectangles, so x and y scales can differ."}
          </p>
        </div>
      </Section>

      <Section title="Show">
        <Toggle label="Grid lines" checked={s.grid} onChange={(v) => setShow("grid", v)} testId="toggle-grid" />
        <Toggle label="Axes" checked={s.axes} onChange={(v) => setShow("axes", v)} testId="toggle-axes" />
        <Toggle label="Arrowheads" checked={s.arrows} onChange={(v) => setShow("arrows", v)} testId="toggle-arrows" />
        <Toggle label="Tick marks" checked={s.ticks} onChange={(v) => setShow("ticks", v)} testId="toggle-ticks" />
        <Toggle label="Numbers" checked={s.labels} onChange={(v) => setShow("labels", v)} testId="toggle-labels" />
        <Toggle
          label="0 at the origin"
          checked={s.originLabel}
          onChange={(v) => setShow("originLabel", v)}
          testId="toggle-origin"
        />
        <Toggle label="Axis titles" checked={s.axisTitles} onChange={(v) => setShow("axisTitles", v)} testId="toggle-titles" />
      </Section>

      <Section title="Lines and numbers">
        <Num editor={editor} field="axisWidthPt" label="Axis thickness" suffix="pt" />
        <Num editor={editor} field="gridWidthPt" label="Grid thickness" suffix="pt" />
        <Num editor={editor} field="fontSizePt" label="Number size" suffix="pt" />
        <div className="mt-3 grid grid-cols-[1fr_auto] items-center gap-3">
          <span className="text-[0.95rem] text-ink">Grid color</span>
          <Segmented
            label="Grid color"
            value={form.gridTone}
            onChange={(v) => setField("gridTone", v)}
            options={[
              { value: "gray", label: "Gray" },
              { value: "black", label: "Black" },
            ]}
          />
          <span className="text-[0.95rem] text-ink">Background</span>
          <Segmented
            label="Background"
            testId="background"
            value={form.background}
            onChange={(v) => setField("background", v)}
            options={[
              { value: "white", label: "White" },
              { value: "transparent", label: "Clear" },
            ]}
          />
        </div>
      </Section>
    </div>
  );
}
