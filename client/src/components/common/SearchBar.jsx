import { useEffect, useState } from 'react';

/**
 * Debounced search input. Holds its own text while typing and only calls
 * `onSearch` after `delay` ms of inactivity, so we don't fire a request per
 * keystroke. Controlled by `value` so a parent "clear filters" action can
 * reset it.
 */
export default function SearchBar({ value = '', onSearch, placeholder = 'Search...', delay = 300 }) {
  const [text, setText] = useState(value);

  useEffect(() => {
    setText(value);
  }, [value]);

  useEffect(() => {
    const id = setTimeout(() => {
      if (text !== value) onSearch(text);
    }, delay);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  return (
    <input
      type="search"
      value={text}
      onChange={(e) => setText(e.target.value)}
      placeholder={placeholder}
      className="w-full sm:w-64 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
    />
  );
}
