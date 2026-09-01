"use client";

import { useState, useRef, useEffect } from "react";
import { IconChevronDown, IconSearch } from "@tabler/icons-react";
import { COUNTRIES } from "@/lib/countries";

interface CountrySelectProps {
  name: string;
  required?: boolean;
  defaultValue?: string;
}

export function CountrySelect({
  name,
  required = false,
  defaultValue = "",
}: CountrySelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCountry, setSelectedCountry] = useState(defaultValue);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const filteredCountries = COUNTRIES.filter((country) =>
    country.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const handleSelectCountry = (country: string) => {
    setSelectedCountry(country);
    setIsOpen(false);
    setSearchTerm("");
  };

  return (
    <div
      ref={containerRef}
      className="relative"
    >
      <input
        type="hidden"
        name={name}
        value={selectedCountry}
        required={required}
      />
      
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="field w-full flex items-center justify-between appearance-none bg-[var(--bg)] text-left"
      >
        <span className={selectedCountry ? "text-[var(--fg)]" : "text-muted"}>
          {selectedCountry || "Select your country"}
        </span>
        <IconChevronDown
          className={`text-muted transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
          size={16}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 z-50 mt-2 rounded-lg border border-[var(--border)] bg-[var(--bg)] shadow-lg">
          <div className="sticky top-0 border-b border-[var(--border)] bg-[var(--bg)] p-3">
            <div className="relative">
              <IconSearch
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
                size={16}
              />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search countries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="field pl-10 w-full text-sm"
              />
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto">
            {filteredCountries.length > 0 ? (
              filteredCountries.map((country) => (
                <button
                  key={country}
                  type="button"
                  onClick={() => handleSelectCountry(country)}
                  className={`w-full px-4 py-3 text-left text-sm transition-colors hover:bg-[var(--border)] ${
                    selectedCountry === country
                      ? "bg-[var(--amber)]/10 text-[var(--amber)]"
                      : "text-[var(--fg)]"
                  }`}
                >
                  {country}
                </button>
              ))
            ) : (
              <div className="px-4 py-6 text-center text-sm text-muted">
                No countries found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
