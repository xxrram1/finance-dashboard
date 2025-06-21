// src/components/ui/month-year-picker.tsx

import React, { useMemo } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectPortal } from '@/components/ui/select';
import { Calendar as CalendarIcon, ChevronDown } from 'lucide-react';
import { format, setMonth, setYear } from 'date-fns';
import { th } from 'date-fns/locale';
import { cn } from '@/lib/utils'; // Assuming cn utility is available

interface MonthYearPickerProps {
  selectedDate: string; // Expected format: 'YYYY-MM'
  onDateChange: (newDate: string) => void;
  className?: string;
  disabled?: boolean;
}

const MonthYearPicker: React.FC<MonthYearPickerProps> = ({
  selectedDate,
  onDateChange,
  className,
  disabled,
}) => {
  const currentYear = useMemo(() => new Date().getFullYear(), []);

  // Generate available years for the year selection dropdown (current +/- 5 years)
  const availableYears = useMemo(() => {
    const years = [];
    for (let i = -5; i <= 5; i++) { // 5 years before and 5 years after current
      years.push(currentYear + i);
    }
    return years.sort((a, b) => b - a); // Sort descending
  }, [currentYear]);

  // Generate available months for the month selection dropdown
  const availableMonths = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => ({
      value: (i + 1).toString().padStart(2, '0'),
      label: format(new Date(2000, i, 1), 'MMMM', { locale: th }) // Full month name in Thai
    }));
  }, []);

  // Handler for changing the selected month or year
  const handleMonthYearChange = (type: 'month' | 'year', value: string) => {
    const currentDateObj = new Date(selectedDate + '-01'); // Convert 'YYYY-MM' to a Date object
    let newDateObj = currentDateObj;

    if (type === 'month') {
      newDateObj = setMonth(currentDateObj, parseInt(value, 10) - 1); // setMonth expects 0-indexed month
    } else { // type === 'year'
      newDateObj = setYear(currentDateObj, parseInt(value, 10));
    }
    onDateChange(format(newDateObj, 'yyyy-MM')); // Format back to 'YYYY-MM'
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn("flex-1 sm:flex-initial sm:w-48 justify-between pr-3", className)}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          <span>{format(new Date(selectedDate + '-01'), 'MMMMyyyy', { locale: th })}</span>
          <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2">
        <div className="flex gap-2">
          <Select
            value={selectedDate.slice(5, 7)}
            onValueChange={(value) => handleMonthYearChange('month', value)}
            disabled={disabled}
          >
            <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
            <SelectPortal>
              <SelectContent position="popper">
                {availableMonths.map(month => (
                  <SelectItem key={month.value} value={month.value}>{month.label}</SelectItem>
                ))}
              </SelectContent>
            </SelectPortal>
          </Select>
          <Select
            value={selectedDate.slice(0, 4)}
            onValueChange={(value) => handleMonthYearChange('year', value)}
            disabled={disabled}
          >
            <SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger>
            <SelectPortal>
              <SelectContent position="popper">
                {availableYears.map(year => (
                  <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                ))}
              </SelectContent>
            </SelectPortal>
          </Select>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export { MonthYearPicker };