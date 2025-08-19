// components/ConfirmDeleteButton.tsx
'use client';

type Props = {
  table: string;
  id: string;
  refTable?: string;
  refColumn?: string;
  softField?: string;
  softValue?: string | boolean;
  redirectPath: string;
  label?: string;
  confirmTitle?: string;
  confirmBody?: string;
  action: (formData: FormData) => void;
  style?: React.CSSProperties;
};

export default function ConfirmDeleteButton({
  table,
  id,
  refTable,
  refColumn,
  softField,
  softValue = true,
  redirectPath,
  label = 'Delete',
  confirmTitle = 'Delete item?',
  confirmBody = 'If used on any record it will be archived and hidden; otherwise it will be deleted.',
  action,
  style,
}: Props) {
  return (
    <form action={action} style={{ display: 'inline' }}>
      <input type="hidden" name="table" value={table} />
      <input type="hidden" name="id" value={id} />
      {refTable ? <input type="hidden" name="refTable" value={refTable} /> : null}
      {refColumn ? <input type="hidden" name="refColumn" value={refColumn} /> : null}
      {softField ? <input type="hidden" name="softField" value={softField} /> : null}
      {softField != null ? (
        <input type="hidden" name="softValue" value={String(softValue)} />
      ) : null}
      <input type="hidden" name="redirectPath" value={redirectPath} />
      <button
        type="submit"
        style={style}
        onClick={(e) => {
          const ok = window.confirm(`${confirmTitle}\n\n${confirmBody}`);
          if (!ok) e.preventDefault();
        }}
      >
        {label}
      </button>
    </form>
  );
}
