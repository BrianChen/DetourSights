'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import styles from './SearchBar.module.css';

function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export default function SearchBar({ compact = false }) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(-1);
  const debouncedQuery = useDebounce(query, 150);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    fetch(`/api/destinations?search=${encodeURIComponent(debouncedQuery)}`)
      .then((r) => r.json())
      .then((data) => {
        setSuggestions(data);
        setOpen(data.length > 0);
        setSelected(-1);
      })
      .catch(() => {});
  }, [debouncedQuery]);

  useEffect(() => {
    function handleClick(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function navigate(destination) {
    setQuery('');
    setOpen(false);
    router.push(`/${destination.slug}`);
  }

  function handleKeyDown(e) {
    if (!open) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelected((s) => Math.min(s + 1, suggestions.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSelected((s) => Math.max(s - 1, 0)); }
    else if (e.key === 'Enter') { if (selected >= 0) navigate(suggestions[selected]); else setOpen(false); }
    else if (e.key === 'Escape') setOpen(false);
  }

  function handleSearch() {
    const target = suggestions[selected >= 0 ? selected : 0];
    if (target) navigate(target);
  }

  return (
    <div className={`${styles.wrapper} ${compact ? styles.compact : ''}`} ref={containerRef}>
      <div className={styles.bar}>
        {compact && <span className={styles.searchIcon}><Search size={16} /></span>}
        <input
          className={styles.input}
          type="text"
          placeholder="Search destinations..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          autoComplete="off"
        />
        {!compact && <button className={styles.button} onClick={handleSearch}>Search</button>}
      </div>
      {open && (
        <ul className={styles.dropdown}>
          {suggestions.map((d, i) => (
            <li
              key={d.id}
              className={`${styles.item} ${i === selected ? styles.active : ''}`}
              onMouseDown={() => navigate(d)}
              onMouseEnter={() => setSelected(i)}
            >
              <span className={styles.destName}>{d.name}</span>
              <span className={styles.country}>{d.country}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
