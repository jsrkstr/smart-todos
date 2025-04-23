"use client"

import * as React from "react"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { Checkbox } from "../ui/checkbox"

interface RepeatSettingsProps {
  value?: string // RRULE string
  onChange: (rrule: string) => void
}

type RepeatFrequency = "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY"
type WeekDay = "MO" | "TU" | "WE" | "TH" | "FR" | "SA" | "SU"

const WEEKDAYS: WeekDay[] = ["MO", "TU", "WE", "TH", "FR"]
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1)
const MONTHS = [
  { value: "1", label: "January" },
  { value: "2", label: "February" },
  { value: "3", label: "March" },
  { value: "4", label: "April" },
  { value: "5", label: "May" },
  { value: "6", label: "June" },
  { value: "7", label: "July" },
  { value: "8", label: "August" },
  { value: "9", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
]

export function RepeatSettings({ value, onChange }: RepeatSettingsProps) {
  const [frequency, setFrequency] = React.useState<RepeatFrequency>("DAILY")
  const [interval, setInterval] = React.useState(1)
  const [weekday, setWeekday] = React.useState<WeekDay>("MO")
  const [monthDay, setMonthDay] = React.useState(1)
  const [yearMonth, setYearMonth] = React.useState("1")
  const [yearDay, setYearDay] = React.useState(1)
  const [repeatOn, setRepeatOn] = React.useState(!!value)
  const [isInitializing, setIsInitializing] = React.useState(true)

  // Parse existing RRULE if provided
  React.useEffect(() => {
    if (!value) {
      setIsInitializing(false)
      return
    }

    const rrule = value.replace("RRULE:", "")
    const parts = rrule.split(";").reduce((acc, part) => {
      const [key, value] = part.split("=")
      return { ...acc, [key]: value }
    }, {} as Record<string, string>)

    if (parts.FREQ) setFrequency(parts.FREQ as RepeatFrequency)
    if (parts.INTERVAL) setInterval(parseInt(parts.INTERVAL))
    if (parts.BYDAY) setWeekday(parts.BYDAY as WeekDay)
    if (parts.BYMONTHDAY) setMonthDay(parseInt(parts.BYMONTHDAY))
    if (parts.BYMONTH) setYearMonth(parts.BYMONTH)
    if (parts.BYYEARDAY) setYearDay(parseInt(parts.BYYEARDAY))
    
    setIsInitializing(false)
  }, [value])

  // Generate RRULE string based on current settings
  const generateRRule = (
    frequency: RepeatFrequency,
    interval: number,
    weekday: WeekDay,
    monthDay: number,
    yearMonth: string,
    yearDay: number,
    repeatOn: boolean
  ) => {
    if (!repeatOn) {
      return '';
    }

    const parts: string[] = [`FREQ=${frequency}`];

    if (interval > 1) {
      parts.push(`INTERVAL=${interval}`);
    }

    switch (frequency) {
      case "WEEKLY":
        parts.push(`BYDAY=${weekday}`);
        break;
      case "MONTHLY":
        parts.push(`BYMONTHDAY=${monthDay}`);
        break;
      case "YEARLY":
        if (yearMonth && yearDay) {
          parts.push(`BYMONTH=${yearMonth}`);
          parts.push(`BYMONTHDAY=${yearDay}`);
        }
        break;
    }

    return `RRULE:${parts.join(";")}`;
  }

  // Custom setters that update state and call onChange
  const handleSetFrequency = (newFrequency: RepeatFrequency) => {
    setFrequency(newFrequency)
    onChange(generateRRule(newFrequency, interval, weekday, monthDay, yearMonth, yearDay, repeatOn))
  }

  const handleSetInterval = (newInterval: number) => {
    setInterval(newInterval)
    onChange(generateRRule(frequency, newInterval, weekday, monthDay, yearMonth, yearDay, repeatOn))
  }

  const handleSetWeekday = (newWeekday: WeekDay) => {
    setWeekday(newWeekday)
    onChange(generateRRule(frequency, interval, newWeekday, monthDay, yearMonth, yearDay, repeatOn))
  }

  const handleSetMonthDay = (newMonthDay: number) => {
    setMonthDay(newMonthDay)
    onChange(generateRRule(frequency, interval, weekday, newMonthDay, yearMonth, yearDay, repeatOn))
  }

  const handleSetYearMonth = (newYearMonth: string) => {
    setYearMonth(newYearMonth)
    onChange(generateRRule(frequency, interval, weekday, monthDay, newYearMonth, yearDay, repeatOn))
  }

  const handleSetYearDay = (newYearDay: number) => {
    setYearDay(newYearDay)
    onChange(generateRRule(frequency, interval, weekday, monthDay, yearMonth, newYearDay, repeatOn))
  }

  const handleSetRepeatOn = (newRepeatOn: boolean) => {
    setRepeatOn(newRepeatOn)
    onChange(newRepeatOn ? generateRRule(frequency, interval, weekday, monthDay, yearMonth, yearDay, newRepeatOn) : '')
  }

  return (
    <div>
      <div className="flex items-center gap-2">
        <label
          htmlFor="repeat-checkbox"
          className="flex items-center gap-2 text-sm"
        >
          Repeats
        </label>
        <Checkbox
          id="repeat-checkbox"
          checked={repeatOn}
          onCheckedChange={(checked) => handleSetRepeatOn(!!checked)}
        />
      </div>
      { repeatOn && (<div className="space-y-6">
        <div className="space-y-4">
          <Label>Repeat every...</Label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={1}
              max={99}
              value={interval}
              onChange={(e) => handleSetInterval(parseInt(e.target.value) || 1)}
              className="w-20"
            />
            <Select value={frequency} onValueChange={(v) => handleSetFrequency(v as RepeatFrequency)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DAILY">Day</SelectItem>
                <SelectItem value="WEEKLY">Week</SelectItem>
                <SelectItem value="MONTHLY">Month</SelectItem>
                <SelectItem value="YEARLY">Year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {frequency === "WEEKLY" && (
          <div className="space-y-4">
            <Label>On</Label>
            <RadioGroup value={weekday} onValueChange={(v) => handleSetWeekday(v as WeekDay)}>
              <div className="grid grid-cols-2 gap-2">
                {WEEKDAYS.map((day) => (
                  <div key={day} className="flex items-center space-x-2">
                    <RadioGroupItem value={day} id={`day-${day}`} />
                    <Label htmlFor={`day-${day}`}>{day}</Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </div>
        )}

        {frequency === "MONTHLY" && (
          <div className="space-y-4">
            <Label>On day</Label>
            <Select value={monthDay.toString()} onValueChange={(v) => handleSetMonthDay(parseInt(v))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DAYS.map((day) => (
                  <SelectItem key={day} value={day.toString()}>
                    {day}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {frequency === "YEARLY" && (
          <div className="space-y-4">
            <Label>On</Label>
            <div className="flex gap-2">
              <Select value={yearMonth} onValueChange={handleSetYearMonth}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((month) => (
                    <SelectItem key={month.value} value={month.value}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={yearDay.toString()} onValueChange={(v) => handleSetYearDay(parseInt(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DAYS.map((day) => (
                    <SelectItem key={day} value={day.toString()}>
                      {day}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </div>)}
    </div>
  )
} 