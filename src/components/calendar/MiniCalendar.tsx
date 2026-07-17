"use client";

import React, { useState, useEffect } from "react";
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  addDays 
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface MiniCalendarProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
}

export function MiniCalendar({ selectedDate, onSelectDate }: MiniCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(selectedDate);

  // Sync internal state when external selection changes drastically
  useEffect(() => {
    if (!isSameMonth(selectedDate, currentMonth)) {
      setCurrentMonth(selectedDate);
    }
  }, [selectedDate]);

  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const prevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const renderHeader = () => {
    return (
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={prevMonth}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
        >
          <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-300" />
        </button>
        <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
          {format(currentMonth, "MMMM yyyy")}
        </h2>
        <button
          onClick={nextMonth}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
        >
          <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-300" />
        </button>
      </div>
    );
  };

  const renderDays = () => {
    const days = [];
    const dateFormat = "EE";
    const startDate = startOfWeek(currentMonth);

    for (let i = 0; i < 7; i++) {
      days.push(
        <div className="text-center text-[10px] font-medium text-gray-500 uppercase tracking-wider py-1" key={i}>
          {format(addDays(startDate, i), dateFormat).charAt(0)}
        </div>
      );
    }

    return <div className="grid grid-cols-7 mb-2">{days}</div>;
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const rows = [];
    let days = [];
    let day = startDate;
    let formattedDate = "";

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        formattedDate = format(day, "d");
        const cloneDay = day;
        
        const isSelected = isSameDay(day, selectedDate);
        const isCurrentMonth = isSameMonth(day, monthStart);
        const isToday = isSameDay(day, new Date());

        days.push(
          <div
            className={`
              flex justify-center items-center h-8 w-8 text-xs cursor-pointer rounded-full transition-all
              ${!isCurrentMonth ? "text-gray-300 dark:text-gray-600" : "text-gray-700 dark:text-gray-200 hover:bg-indigo-50 dark:hover:bg-indigo-900/30"}
              ${isSelected ? "bg-indigo-600 text-white hover:bg-indigo-700 dark:text-white dark:hover:bg-indigo-700" : ""}
              ${isToday && !isSelected ? "border border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400" : ""}
            `}
            key={day.toISOString()}
            onClick={() => onSelectDate(cloneDay)}
          >
            <span>{formattedDate}</span>
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div className="grid grid-cols-7 gap-1 justify-items-center mb-1" key={day.toISOString()}>
          {days}
        </div>
      );
      days = [];
    }
    return <div>{rows}</div>;
  };

  return (
    <div className="w-full">
      {renderHeader()}
      {renderDays()}
      {renderCells()}
    </div>
  );
}
