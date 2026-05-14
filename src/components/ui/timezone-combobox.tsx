'use client'

import { useState, useMemo } from 'react'
import { Check, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

function getTimezones(): string[] {
  try {
    return Intl.supportedValuesOf('timeZone')
  } catch {
    return ['UTC', 'Europe/Moscow', 'Europe/London', 'America/New_York', 'America/Los_Angeles', 'Asia/Tokyo']
  }
}

interface Props {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function TimezoneCombobox({ value, onChange, placeholder = 'UTC' }: Props) {
  const [open, setOpen] = useState(false)
  const timezones = useMemo(() => getTimezones(), [])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        role="combobox"
        aria-expanded={open}
        className={cn(buttonVariants({ variant: 'outline' }), 'w-full justify-between font-normal')}
      >
        {value || placeholder}
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
        <Command>
          <CommandInput placeholder="Search timezone…" />
          <CommandList>
            <CommandEmpty>No timezone found.</CommandEmpty>
            <CommandGroup>
              {timezones.map((tz) => (
                <CommandItem
                  key={tz}
                  value={tz}
                  onSelect={() => {
                    onChange(tz)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn('mr-2 h-4 w-4', value.toLowerCase() === tz.toLowerCase() ? 'opacity-100' : 'opacity-0')}
                  />
                  {tz}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
