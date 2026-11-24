import { useRef, useState } from 'react';
import './PasswordField.css';

function EyeIcon({ hidden }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M2.2 12s3.6-6.2 9.8-6.2S21.8 12 21.8 12s-3.6 6.2-9.8 6.2S2.2 12 2.2 12Z" />
      <circle cx="12" cy="12" r="2.9" />
      {hidden && <path d="M3.6 3.6l16.8 16.8" />}
    </svg>
  );
}

/**
 * Password input with a show/hide eye toggle.
 * Starts hidden on every mount and never stores the value itself.
 */
export default function PasswordField({
  label,
  id,
  className = '',
  inputClassName = '',
  onChange,
  ...inputProps
}) {
  const [visible, setVisible] = useState(false);
  const inputRef = useRef(null);

  const toggle = () => {
    const input = inputRef.current;
    let selection = null;
    try {
      if (input) selection = [input.selectionStart, input.selectionEnd];
    } catch {
      selection = null;
    }
    setVisible((current) => !current);
    if (!input) return;
    requestAnimationFrame(() => {
      input.focus({ preventScroll: true });
      if (!selection) return;
      const [start, end] = selection;
      if (start === null || end === null) return;
      try {
        input.setSelectionRange(start, end);
      } catch {
        /* some browsers drop the caret when the type changes */
      }
    });
  };

  return (
    <label className={`pw-field ${className}`.trim()} htmlFor={id}>
      {label}
      <span className="pw-input-wrap">
        <input
          {...inputProps}
          id={id}
          ref={inputRef}
          type={visible ? 'text' : 'password'}
          className={`pw-input ${inputClassName}`.trim()}
          onChange={onChange}
        />
        <button
          type="button"
          className="pw-toggle"
          onClick={toggle}
          aria-label={visible ? 'Hide password' : 'Show password'}
          title={visible ? 'Hide password' : 'Show password'}
        >
          <EyeIcon hidden={visible} />
        </button>
      </span>
    </label>
  );
}
