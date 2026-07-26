'use client'

import { useState } from 'react'
import { CircleHelp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

export default function LearnHelpDialog() {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="How Learn works"
          className="shrink-0"
        >
          <CircleHelp className="h-4 w-4" aria-hidden="true" />
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>How Learn works</DialogTitle>
          <DialogDescription>
            Your tutor, lesson panel, and practice activities work together in one session.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 text-sm text-(--text-secondary)">
          <section>
            <h3 className="font-bold text-(--text-primary)">Voice side</h3>
            <p className="mt-1 leading-relaxed">
              Choose voice or text mode, then start your lesson. Voice mode lets you speak with the tutor;
              text mode works without a microphone. Microphone permission is only requested when you pick
              voice mode and start or test your microphone.
            </p>
          </section>

          <section>
            <h3 className="font-bold text-(--text-primary)">Content side</h3>
            <p className="mt-1 leading-relaxed">
              The tutor can show explanations, quick checks, and interactive activities in this panel.
              On desktop, this area scrolls independently so you can review long content without moving
              the voice controls.
            </p>
          </section>

          <section>
            <h3 className="font-bold text-(--text-primary)">Closing this help</h3>
            <p className="mt-1 leading-relaxed">
              Close with Got it, the X button, or Escape. Your voice session and any activity in progress
              stay exactly as you left them.
            </p>
          </section>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button">Got it</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
