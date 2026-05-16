"use client";

import React, { useState, useEffect, useRef } from "react";
import { cities } from "@/lib/data/cities";
import { Check, MapPin } from "lucide-react";

interface City {
  name: string;
  state: string;
  lat: number;
  lng: number;
  timezone: string;
}

interface CitySearchProps {
  onSelect: (city: City) => void;
}

export default function CitySearch({ onSelect }: CitySearchProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [filteredCities, setFilteredCities] = useState<City[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query.length > 1) {
      const filtered = (cities as readonly City[])
        .filter((city) =>
          city.name.toLowerCase().includes(query.toLowerCase()) ||
          city.state.toLowerCase().includes(query.toLowerCase())
        )
        .slice(0, 8);
      setFilteredCities(filtered as City[]);
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  }, [query]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      setSelectedIndex((prev) => (prev < filteredCities.length - 1 ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === "Enter" && selectedIndex >= 0) {
      e.preventDefault();
      handleSelect(filteredCities[selectedIndex]);
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  const handleSelect = (city: City) => {
    setQuery(`${city.name}, ${city.state}`);
    setIsOpen(false);
    onSelect(city);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => query.length > 1 && setIsOpen(true)}
          placeholder="Enter birth city..."
          className="w-full h-14 glass-card px-6 focus:border-cyan-500/50 transition-all outline-none text-xl font-light text-zinc-900 placeholder:text-zinc-400"
          autoComplete="off"
        />
        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">
          <MapPin className="w-5 h-5" />
        </div>
        
        {isOpen && filteredCities.length > 0 && (
          <div className="absolute z-50 w-full mt-3 glass-card border border-zinc-200 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
            {filteredCities.map((city, index) => (
              <div
                key={`${city.name}-${city.state}`}
                onClick={() => handleSelect(city)}
                onMouseEnter={() => setSelectedIndex(index)}
                className={`p-5 cursor-pointer flex justify-between items-center transition-all
                           ${index === selectedIndex ? "bg-cyan-50 text-cyan-700" : "text-zinc-600 hover:bg-zinc-50"}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${index === selectedIndex ? "bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.6)]" : "bg-zinc-200"}`} />
                  <div>
                    <span className="font-medium text-lg leading-none">{city.name}</span>
                    <span className="text-xs text-gray-500 ml-2 uppercase tracking-tighter">{city.state}</span>
                  </div>
                </div>
                {index === selectedIndex && <Check className="w-4 h-4" />}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
