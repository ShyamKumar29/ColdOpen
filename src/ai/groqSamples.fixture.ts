/**
 * Sixteen real `llama-3.3-70b-versatile` responses to distinct premises,
 * captured through the same system prompt the serverless proxy sends.
 *
 * Only four of the sixteen validated before the coercion layer landed
 * (ADR-029); the rest failed on a missing `beats[].id`, a `null` written
 * in place of an absent optional field, an out-of-vocabulary `setting`, or
 * an enum value borrowed from a sibling enum. They are stored verbatim,
 * flaws included, so the ingestion path is exercised against what the model
 * actually produces rather than a hand-written approximation of it.
 */
export interface GroqSampleResponse {
  premise: string
  script: unknown
}

export const groqSampleResponses: readonly GroqSampleResponse[] = [
  {
    premise: 'A lighthouse keeper hears a voice in the fog that knows her name.',
    script: {
      version: '1.0',
      title: 'Fogbound',
      genre: 'horror',
      mood: 'ominous',
      scene: {
        slugline: 'EXT. LIGHTHOUSE - NIGHT',
        setting: 'lighthouse',
        timeOfDay: 'night',
        weather: 'fog',
      },
      cast: [
        {
          id: 'emily',
          name: 'Emily May',
          archetype: 'stranger',
          build: 'slight',
          voice: {
            register: 'mid',
            rate: 'normal',
          },
          entrance: {
            beat: 2,
            from: 'already-present',
            style: 'stand',
          },
          silhouetteAccent: 'coat',
        },
      ],
      beats: [
        {
          type: 'title',
          subtitle: 'A foggy night',
        },
        {
          type: 'slugline',
        },
        {
          type: 'action',
          text: "Emily stands at the lantern room's edge, peering into the fog.",
          narrate: true,
        },
        {
          type: 'dialogue',
          characterId: 'emily',
          line: 'Hello? Is anyone there?',
          parenthetical: '(calling out into the fog)',
          delivery: 'urgent',
          gesture: 'point',
        },
        {
          type: 'action',
          text: 'The fog swallows her words.',
          narrate: true,
          camera: {
            move: 'pushIn',
            target: 'emily',
            intensity: 'dramatic',
            durationMs: 800,
          },
          lighting: {
            preset: 'coldMoonlight',
            transition: 'fade',
            durationMs: 800,
          },
        },
        {
          type: 'dialogue',
          characterId: 'emily',
          line: 'Emily?',
          parenthetical: '(the voice is low and raspy, seemingly from all around her)',
          delivery: 'trembling',
          gesture: 'recoil',
        },
        {
          type: 'beat',
          durationMs: 400,
        },
        {
          type: 'action',
          text: "Emily spins around, but there's no one in sight.",
          narrate: true,
          holdMs: 600,
        },
      ],
      outro: {
        style: 'holdOnActor',
        text: 'The fog closes in.',
      },
    },
  },
  {
    premise: 'Two rival chefs discover their restaurant is built on a portal.',
    script: {
      version: '1.0',
      title: 'Feast of Fate',
      genre: 'fantasy',
      mood: 'mysterious',
      scene: {
        slugline: 'INT. RESTAURANT KITCHEN - NIGHT',
        setting: 'office',
        timeOfDay: 'night',
        weather: 'clear',
        establishingText: 'Bistro Bliss, Established 2010',
      },
      cast: [
        {
          id: 'marc',
          name: 'Marc Laurent',
          archetype: 'leader',
          build: 'average',
          voice: {
            register: 'mid',
            rate: 'normal',
          },
          entrance: {
            beat: 1,
            from: 'offLeft',
            style: 'walk',
          },
          silhouetteAccent: 'hat',
        },
        {
          id: 'lisa',
          name: 'Lisa Nguyen',
          archetype: 'rival',
          build: 'slight',
          voice: {
            register: 'high',
            rate: 'fast',
          },
          entrance: {
            beat: 2,
            from: 'offRight',
            style: 'stride',
          },
        },
      ],
      beats: [
        {
          id: 'start',
          type: 'title',
          subtitle: 'A Recipe for Chaos',
        },
        {
          id: 'enter-marc',
          type: 'action',
          text: 'Marc Laurent, a renowned chef, inspects the kitchen.',
          narrate: true,
          holdMs: 800,
          camera: {
            move: 'panLeft',
            target: 'marc',
            intensity: 'subtle',
            durationMs: 600,
          },
        },
        {
          id: 'enter-lisa',
          type: 'action',
          text: "Lisa Nguyen, a talented chef and Marc's rival, rushes in.",
          narrate: true,
          holdMs: 400,
          camera: {
            move: 'panRight',
            target: 'lisa',
            intensity: 'normal',
            durationMs: 400,
          },
        },
        {
          id: 'confront',
          type: 'dialogue',
          characterId: 'marc',
          line: 'What are you doing here, Lisa?',
          delivery: 'flat',
          gesture: 'point',
        },
        {
          id: 'reply',
          type: 'dialogue',
          characterId: 'lisa',
          line: 'I could ask you the same, Marc.',
          delivery: 'wry',
          gesture: 'shrug',
        },
        {
          id: 'suspense',
          type: 'beat',
          durationMs: 1000,
          music: {
            action: 'start',
            mood: 'tense',
            intensity: 0.5,
          },
        },
        {
          id: 'discovery',
          type: 'reveal',
          text: 'A strange glow emanates from the floor.',
          holdMs: 1200,
          lighting: {
            preset: 'singleSpot',
            transition: 'fade',
            durationMs: 800,
          },
          particles: {
            effect: 'dust',
            density: 0.2,
            action: 'start',
          },
        },
      ],
      outro: {
        style: 'cutToBlack',
        text: 'The Feast Begins',
      },
    },
  },
  {
    premise: 'A detective interrogates a suspect who claims to be from the future.',
    script: {
      version: '1.0',
      title: 'Future Tense',
      genre: 'scifi',
      mood: 'tense',
      scene: {
        slugline: 'INT. POLICE STATION - NIGHT',
        setting: 'office',
        timeOfDay: 'night',
      },
      cast: [
        {
          id: 'detective-james',
          name: 'Detective James',
          archetype: 'leader',
          build: 'average',
          voice: {
            register: 'mid',
            rate: 'normal',
          },
          entrance: {
            beat: 0,
            from: 'offLeft',
            style: 'walk',
          },
        },
        {
          id: 'future-man',
          name: 'The Suspect',
          archetype: 'stranger',
          build: 'slight',
          voice: {
            register: 'high',
            rate: 'fast',
          },
          entrance: {
            beat: 0,
            from: 'already-present',
            style: 'none',
          },
        },
      ],
      beats: [
        {
          type: 'slugline',
        },
        {
          type: 'action',
          text: 'Detective James enters the dimly lit interrogation room, a single flickering fluorescent light above.',
          camera: {
            move: 'pushIn',
            target: 'detective-james',
            intensity: 'subtle',
            durationMs: 1000,
          },
        },
        {
          type: 'dialogue',
          characterId: 'detective-james',
          line: "So, you're claiming to be from the future?",
          delivery: 'flat',
          gesture: 'point',
        },
        {
          type: 'dialogue',
          characterId: 'future-man',
          line: "That's right. 2050, to be exact.",
          parenthetical: '(nervously)',
          delivery: 'urgent',
          gesture: 'shrug',
        },
        {
          type: 'beat',
          durationMs: 500,
        },
        {
          type: 'action',
          text: 'The detective raises an eyebrow, skeptical.',
          narrate: true,
          camera: {
            move: 'panRight',
            target: 'detective-james',
            intensity: 'normal',
            durationMs: 500,
          },
        },
        {
          type: 'dialogue',
          characterId: 'detective-james',
          line: "And what makes you think you're from the future?",
          delivery: 'wry',
          gesture: 'step-forward',
        },
        {
          type: 'dialogue',
          characterId: 'future-man',
          line: "I have knowledge of events that haven't happened yet.",
          delivery: 'flat',
          gesture: 'none',
        },
        {
          type: 'beat',
          durationMs: 1000,
          camera: {
            move: 'pullBack',
            target: 'wide',
            intensity: 'dramatic',
            durationMs: 1000,
          },
        },
      ],
      outro: {
        style: 'holdOnActor',
        text: 'The Truth Awaits',
      },
    },
  },
  {
    premise: 'A child finds a door in the forest that only opens at midnight.',
    script: {
      version: '1.0',
      title: 'Midnight Door',
      genre: 'fantasy',
      mood: 'mysterious',
      scene: {
        slugline: 'EXT. FOREST - NIGHT',
        setting: 'forest',
        timeOfDay: 'night',
        weather: 'clear',
        establishingText: 'Midnight',
      },
      cast: [
        {
          id: 'child',
          name: 'Lily',
          archetype: 'stranger',
          build: 'slight',
          voice: {
            register: 'high',
            rate: 'normal',
          },
          entrance: {
            beat: 2,
            from: 'offLeft',
            style: 'walk',
          },
        },
      ],
      beats: [
        {
          type: 'title',
        },
        {
          type: 'beat',
          durationMs: 1000,
        },
        {
          type: 'action',
          text: 'Lily wanders into the forest, her flashlight casting eerie shadows.',
          narrate: true,
        },
        {
          type: 'dialogue',
          characterId: 'child',
          line: "What's this?",
          parenthetical: '(whispering)',
          delivery: 'trembling',
          gesture: 'reach',
        },
        {
          type: 'reveal',
          text: 'A door materializes before her.',
        },
        {
          type: 'action',
          text: 'The door creaks, slowly opening by itself.',
          narrate: true,
          camera: {
            move: 'pushIn',
            target: 'child',
            intensity: 'subtle',
            durationMs: 2000,
          },
        },
      ],
      outro: {
        style: 'holdOnActor',
        text: "The door's secrets await...",
      },
    },
  },
  {
    premise: 'An astronaut receives a transmission in her own voice.',
    script: {
      version: '1.0',
      title: 'Transmission',
      genre: 'scifi',
      mood: 'mysterious',
      scene: {
        slugline: 'INT. SPACESHIP - NIGHT',
        setting: 'spaceship',
        timeOfDay: 'night',
        weather: null,
        establishingText: 'Solitude-1, 3.7 million km from Earth',
      },
      cast: [
        {
          id: 'maya',
          name: 'Maya Singh',
          archetype: 'leader',
          build: 'slight',
          voice: {
            register: 'mid',
            rate: 'normal',
          },
          entrance: {
            beat: 0,
            from: 'already-present',
            style: 'walk',
          },
          exit: null,
          silhouetteAccent: 'none',
        },
      ],
      beats: [
        {
          id: 'beat-0',
          type: 'slugline',
        },
        {
          id: 'beat-1',
          type: 'action',
          text: 'Maya floats in front of a console, eyes fixed on a screen.',
          narrate: false,
          camera: {
            move: 'pushIn',
            target: 'maya',
            intensity: 'subtle',
            durationMs: 800,
          },
        },
        {
          id: 'beat-2',
          type: 'dialogue',
          characterId: 'maya',
          line: 'Maya to Mission Control, come in.',
          parenthetical: '(concerned)',
          delivery: 'flat',
          gesture: 'reach',
          holdMs: 400,
        },
        {
          id: 'beat-3',
          type: 'action',
          text: 'Static crackles from the comms system.',
          narrate: false,
          music: {
            action: 'start',
            mood: 'tense',
            intensity: 0.5,
          },
        },
        {
          id: 'beat-4',
          type: 'dialogue',
          characterId: 'maya',
          line: 'Hello? Is anyone there?',
          parenthetical: '(urgency rising)',
          delivery: 'urgent',
          gesture: 'step-forward',
          camera: {
            move: 'panLeft',
            target: 'maya',
            intensity: 'normal',
            durationMs: 600,
          },
        },
        {
          id: 'beat-5',
          type: 'action',
          text: "A transmission begins to play, Maya's own voice speaking back to her.",
          narrate: false,
          holdMs: 200,
          music: {
            action: 'swell',
            mood: 'mysterious',
            intensity: 0.8,
          },
        },
      ],
      outro: {
        style: 'holdOnActor',
        text: 'Transmission received...',
      },
    },
  },
  {
    premise: 'A surgeon realizes the patient on the table is himself.',
    script: {
      version: '1.0',
      title: 'Double Scalpel',
      genre: 'thriller',
      mood: 'tense',
      scene: {
        slugline: 'INT. OPERATING ROOM - NIGHT',
        setting: 'office',
        timeOfDay: 'night',
      },
      cast: [
        {
          id: 'surgeon',
          name: 'Dr. Lee',
          archetype: 'leader',
          build: 'average',
          voice: {
            register: 'mid',
            rate: 'normal',
          },
          entrance: {
            beat: 0,
            from: 'offLeft',
            style: 'walk',
          },
        },
      ],
      beats: [
        {
          id: 'beat-1',
          type: 'slugline',
        },
        {
          id: 'beat-2',
          type: 'action',
          text: 'Dr. Lee scrubs in, eyes fixed on the patient.',
          narrate: true,
        },
        {
          id: 'beat-3',
          type: 'dialogue',
          characterId: 'surgeon',
          line: "Let's get started.",
          delivery: 'flat',
        },
        {
          id: 'beat-4',
          type: 'action',
          text: "Dr. Lee's gaze lingers on the patient's face.",
          narrate: true,
          camera: {
            move: 'pushIn',
            target: 'surgeon',
            intensity: 'dramatic',
          },
        },
        {
          id: 'beat-5',
          type: 'dialogue',
          characterId: 'surgeon',
          line: "Wait... what's going on?",
          delivery: 'urgent',
          gesture: 'recoil',
        },
        {
          id: 'beat-6',
          type: 'beat',
          durationMs: 1000,
          camera: {
            move: 'pullBack',
            target: 'wide',
            intensity: 'subtle',
          },
        },
      ],
      outro: {
        style: 'cutToBlack',
      },
    },
  },
  {
    premise: 'A priest finds the confessional booth already occupied at 3am.',
    script: {
      version: '1.0',
      title: 'Dark Confession',
      genre: 'noir',
      mood: 'tense',
      scene: {
        slugline: 'INT. CHURCH - NIGHT',
        setting: 'library',
        timeOfDay: 'night',
        establishingText: '3am',
      },
      cast: [
        {
          id: 'father-michael',
          name: 'Father Michael',
          archetype: 'mentor',
          build: 'average',
          voice: {
            register: 'mid',
            rate: 'normal',
          },
          entrance: {
            beat: 0,
            from: 'offLeft',
            style: 'walk',
          },
        },
        {
          id: 'mysterious-figure',
          name: 'Mysterious Figure',
          archetype: 'stranger',
          silhouetteAccent: 'none',
          entrance: {
            beat: 0,
            from: 'already-present',
            style: 'none',
          },
        },
      ],
      beats: [
        {
          id: 'opening',
          type: 'slugline',
        },
        {
          id: 'father-approaches',
          type: 'action',
          text: 'Father Michael walks slowly towards the confessional booth.',
          camera: {
            move: 'pushIn',
            target: 'father-michael',
            intensity: 'subtle',
          },
        },
        {
          id: 'figure-revealed',
          type: 'reveal',
          text: 'A figure is already inside.',
          holdMs: 1000,
        },
        {
          id: 'father-speaks',
          type: 'dialogue',
          characterId: 'father-michael',
          line: "Who's there?",
          delivery: 'flat',
          camera: {
            move: 'panLeft',
            target: 'mysterious-figure',
            intensity: 'normal',
          },
        },
        {
          id: 'pause',
          type: 'beat',
          durationMs: 500,
        },
        {
          id: 'response',
          type: 'dialogue',
          characterId: 'mysterious-figure',
          line: "I've been waiting.",
          parenthetical: 'whispering',
          delivery: 'whisper',
          gesture: 'none',
        },
      ],
      outro: {
        style: 'holdOnActor',
        text: '',
      },
    },
  },
  {
    premise: 'Two thieves argue about the alarm they just triggered.',
    script: {
      version: '1.0',
      title: 'Triggered',
      genre: 'heist',
      mood: 'tense',
      scene: {
        slugline: 'INT. MUSEUM - NIGHT',
        setting: 'warehouse',
        timeOfDay: 'night',
        weather: 'clear',
      },
      cast: [
        {
          id: 'jack',
          name: 'Jack',
          archetype: 'mastermind',
          voice: {
            register: 'low',
            rate: 'fast',
          },
          entrance: {
            beat: 0,
            from: 'offLeft',
            style: 'stride',
          },
        },
        {
          id: 'sarah',
          name: 'Sarah',
          archetype: 'rookie',
          voice: {
            register: 'high',
            rate: 'normal',
          },
          entrance: {
            beat: 0,
            from: 'offRight',
            style: 'walk',
          },
        },
      ],
      beats: [
        {
          id: 'slugline',
          type: 'slugline',
        },
        {
          id: 'sarah-line',
          type: 'dialogue',
          characterId: 'sarah',
          line: 'What have you done?',
          delivery: 'urgent',
        },
        {
          id: 'jack-line',
          type: 'dialogue',
          characterId: 'jack',
          line: "I didn't trigger it, you did.",
          delivery: 'flat',
        },
        {
          id: 'sarah-reaction',
          type: 'action',
          text: 'Sarah glares at Jack, her eyes wide with fear.',
          narrate: true,
        },
        {
          id: 'timer-start',
          type: 'beat',
          durationMs: 1000,
        },
        {
          id: 'jack-action',
          type: 'action',
          text: 'Jack grabs a nearby fire extinguisher.',
          narrate: false,
          camera: {
            move: 'pushIn',
            target: 'jack',
            intensity: 'dramatic',
          },
        },
        {
          id: 'sarah-line2',
          type: 'dialogue',
          characterId: 'sarah',
          line: 'We have to get out of here, now.',
          delivery: 'shout',
        },
      ],
      outro: {
        style: 'cutToBlack',
      },
    },
  },
  {
    premise: 'A woman wakes up in a hotel that has no exit.',
    script: {
      version: '1.0',
      title: 'Trapped',
      genre: 'thriller',
      mood: 'tense',
      scene: {
        slugline: 'INT. HOTEL ROOM - DAY',
        setting: 'hotel',
        timeOfDay: 'day',
        establishingText: 'Room 314',
      },
      cast: [
        {
          id: 'jess',
          name: 'Jess',
          archetype: 'leader',
          build: 'slight',
          voice: {
            register: 'mid',
            rate: 'normal',
          },
          entrance: {
            beat: 0,
            from: 'already-present',
            style: 'fade',
          },
        },
      ],
      beats: [
        {
          type: 'title',
          subtitle: 'Nowhere to Run',
        },
        {
          type: 'action',
          text: 'Jess slowly opens her eyes to an unfamiliar ceiling.',
          narrate: true,
        },
        {
          type: 'dialogue',
          characterId: 'jess',
          line: 'Where am I?',
          parenthetical: '(disoriented)',
          delivery: 'trembling',
        },
        {
          type: 'action',
          text: 'Jess sits up and looks around the hotel room, taking in her surroundings.',
          narrate: true,
          camera: {
            move: 'panLeft',
            target: 'jess',
            intensity: 'subtle',
          },
        },
        {
          type: 'beat',
          durationMs: 1000,
          holdMs: 500,
        },
        {
          type: 'action',
          text: 'She gets out of bed and approaches the door, trying the handle.',
          narrate: true,
          camera: {
            move: 'pushIn',
            target: 'jess',
            intensity: 'normal',
          },
        },
        {
          type: 'dialogue',
          characterId: 'jess',
          line: "This can't be locked.",
          delivery: 'urgent',
        },
        {
          type: 'reveal',
          text: 'No exit signs anywhere.',
          camera: {
            move: 'whipPan',
            target: 'center',
            intensity: 'dramatic',
          },
        },
      ],
      outro: {
        style: 'holdOnActor',
        text: 'Trapped',
      },
    },
  },
  {
    premise: 'A cowboy rides into a town where everyone knows his name.',
    script: {
      version: '1.0',
      title: 'Red Rock',
      genre: 'western',
      mood: 'tense',
      scene: {
        slugline: 'EXT. RED ROCK MAIN STREET - DAY',
        setting: 'desert',
        timeOfDay: 'day',
        weather: 'clear',
      },
      cast: [
        {
          id: 'cowboy-jack',
          name: 'Jack McCoy',
          archetype: 'leader',
          build: 'tall',
          voice: {
            register: 'low',
            rate: 'slow',
          },
          entrance: {
            beat: 2,
            from: 'offLeft',
            style: 'stride',
          },
        },
      ],
      beats: [
        {
          type: 'title',
          subtitle: 'A Town with a Secret',
        },
        {
          type: 'slugline',
        },
        {
          type: 'action',
          text: 'The main street of Red Rock is empty and still.',
          narrate: true,
        },
        {
          type: 'dialogue',
          characterId: 'cowboy-jack',
          line: 'Afternoon, folks.',
          delivery: 'flat',
        },
        {
          type: 'beat',
          durationMs: 1000,
        },
        {
          type: 'dialogue',
          characterId: 'cowboy-jack',
          line: "Looks like I'm the only stranger here.",
          parenthetical: '(looking around)',
          gesture: 'shrug',
        },
        {
          type: 'action',
          text: 'People peek out from behind curtains, watching Jack.',
          narrate: true,
          holdMs: 500,
        },
        {
          type: 'music',
          action: 'start',
          mood: 'tense',
          intensity: 0.5,
        },
      ],
      outro: {
        style: 'holdOnActor',
      },
    },
  },
  {
    premise: 'A librarian discovers a book that writes itself.',
    script: {
      version: '1.0',
      title: 'The Book',
      genre: 'fantasy',
      mood: 'mysterious',
      scene: {
        slugline: 'INT. GRAND LIBRARY - NIGHT',
        setting: 'library',
        timeOfDay: 'night',
        establishingText: 'Silent, Dusty Tomes',
      },
      cast: [
        {
          id: 'librarian',
          name: 'Eva',
          archetype: 'stranger',
          build: 'slight',
          voice: {
            register: 'mid',
            rate: 'normal',
          },
          entrance: {
            beat: 1,
            from: 'offLeft',
            style: 'walk',
          },
        },
      ],
      beats: [
        {
          type: 'title',
        },
        {
          type: 'action',
          text: 'Eva pushes a cart of books through the stacks, her footsteps echoing.',
          narrate: true,
        },
        {
          type: 'dialogue',
          characterId: 'librarian',
          line: "What's this?",
          parenthetical: '(whispering to herself)',
        },
        {
          type: 'action',
          text: 'She stops at a shelf, running her fingers over the spines of the books.',
          narrate: true,
        },
        {
          type: 'beat',
          durationMs: 500,
        },
        {
          type: 'action',
          text: 'Her eyes land on a leather-bound book with no title.',
          narrate: true,
          camera: {
            move: 'pushIn',
            target: 'librarian',
            intensity: 'subtle',
            durationMs: 800,
          },
        },
        {
          type: 'dialogue',
          characterId: 'librarian',
          line: "This one wasn't here before.",
          delivery: 'flat',
        },
        {
          type: 'action',
          text: 'She carefully pulls the book from the shelf and opens it.',
          narrate: true,
        },
        {
          type: 'reveal',
          text: 'Blank pages.',
          holdMs: 1000,
        },
      ],
      outro: {
        style: 'holdOnActor',
        text: "The Librarian's Discovery",
      },
    },
  },
  {
    premise: 'A soldier finds a radio broadcasting tomorrow.',
    script: {
      version: '1.0',
      title: "Tomorrow's Call",
      genre: 'scifi',
      mood: 'tense',
      scene: {
        slugline: 'INT. ABANDONED BUNKER - NIGHT',
        setting: 'bunker',
        timeOfDay: 'night',
      },
      cast: [
        {
          id: 'soldier',
          name: 'Echo',
          archetype: 'leader',
          voice: {
            register: 'low',
            rate: 'slow',
          },
          entrance: {
            beat: 0,
            from: 'offLeft',
            style: 'walk',
          },
        },
      ],
      beats: [
        {
          type: 'title',
          subtitle: 'Transmission Received: 24 Hours Ahead',
        },
        {
          type: 'action',
          text: 'Echo navigates through the dimly lit, dusty bunker, flashlight in hand.',
          narrate: false,
        },
        {
          type: 'dialogue',
          characterId: 'soldier',
          line: 'What is this place?',
          delivery: 'flat',
        },
        {
          type: 'action',
          text: 'Echo spots an old radio, partially hidden under debris.',
          narrate: false,
        },
        {
          type: 'dialogue',
          characterId: 'soldier',
          line: 'A radio? Here?',
          delivery: 'urgent',
        },
        {
          type: 'action',
          text: 'Echo cautiously approaches the radio and turns it on.',
          narrate: false,
          holdMs: 1000,
        },
        {
          type: 'beat',
          durationMs: 500,
        },
        {
          type: 'dialogue',
          characterId: 'soldier',
          line: "This can't be right. The news... it's tomorrow's.",
          delivery: 'trembling',
        },
      ],
      outro: {
        style: 'cutToBlack',
        text: 'Tomorrow Starts Now',
      },
    },
  },
  {
    premise: 'A ghost tries to warn the family moving into her house.',
    script: {
      version: '1.0',
      title: 'Ghostly Warning',
      genre: 'horror',
      mood: 'ominous',
      scene: {
        slugline: 'INT. OLD MANSION - DAY',
        setting: 'library',
        timeOfDay: 'day',
        establishingText: 'Ravenwood Manor - 1885',
      },
      cast: [
        {
          id: 'emily',
          name: 'Emily',
          archetype: 'stranger',
          voice: {
            register: 'mid',
            rate: 'normal',
          },
          entrance: {
            beat: 2,
            from: 'offLeft',
            style: 'walk',
          },
          silhouetteAccent: 'none',
        },
        {
          id: 'ghost',
          name: 'The Ghost',
          archetype: 'ghost',
          build: 'slight',
          voice: {
            register: 'high',
            rate: 'fast',
          },
          entrance: {
            beat: 1,
            from: 'shadow',
            style: 'fade',
          },
        },
      ],
      beats: [
        {
          id: 'beat1',
          type: 'slugline',
        },
        {
          id: 'beat2',
          type: 'action',
          text: "The ghost watches from the shadows as the family's moving truck pulls up outside.",
          narrate: true,
          camera: {
            move: 'pushIn',
            target: 'ghost',
            intensity: 'subtle',
          },
        },
        {
          id: 'beat3',
          type: 'dialogue',
          characterId: 'ghost',
          line: 'Get out while you still can.',
          delivery: 'whisper',
          gesture: 'none',
        },
        {
          id: 'beat4',
          type: 'action',
          text: 'Emily enters, looking around the dusty room.',
          holdMs: 500,
          camera: {
            move: 'panLeft',
            target: 'emily',
            intensity: 'normal',
          },
        },
        {
          id: 'beat5',
          type: 'dialogue',
          characterId: 'emily',
          line: "Mom, I don't like this house.",
          delivery: 'trembling',
          gesture: 'recoil',
        },
        {
          id: 'beat6',
          type: 'beat',
          durationMs: 1000,
          music: {
            action: 'start',
            mood: 'ominous',
            intensity: 0.5,
          },
        },
      ],
      outro: {
        style: 'cutToBlack',
        text: 'Ravenwood Manor',
      },
    },
  },
  {
    premise: 'A stand-up comedian realizes the audience is not laughing on purpose.',
    script: {
      version: '1.0',
      title: 'Stage Fright',
      genre: 'comedy',
      mood: 'tense',
      scene: {
        slugline: 'INT. COMEDY CLUB - NIGHT',
        setting: 'diner',
        timeOfDay: 'night',
        weather: null,
        establishingText: null,
      },
      cast: [
        {
          id: 'comedian',
          name: 'Jack',
          archetype: 'leader',
          build: null,
          voice: {
            register: 'mid',
            rate: 'fast',
          },
          entrance: {
            beat: 0,
            from: 'already-present',
            style: 'walk',
          },
          exit: null,
          silhouetteAccent: null,
        },
        {
          id: 'heckler',
          name: 'Tom',
          archetype: 'rival',
          build: 'heavy',
          voice: {
            register: 'low',
            rate: 'slow',
          },
          entrance: {
            beat: 2,
            from: 'offLeft',
            style: 'stride',
          },
          exit: null,
          silhouetteAccent: null,
        },
      ],
      beats: [
        {
          id: '1',
          type: 'slugline',
        },
        {
          id: '2',
          type: 'action',
          text: 'Jack tells a joke, but the audience remains silent.',
          narrate: false,
        },
        {
          id: '3',
          type: 'dialogue',
          characterId: 'comedian',
          line: 'Is this thing on?',
          parenthetical: null,
          delivery: 'urgent',
          gesture: 'step-forward',
        },
        {
          id: '4',
          type: 'action',
          text: 'Tom coughs, making Jack glance his way.',
          narrate: false,
          camera: {
            move: 'panLeft',
            target: 'heckler',
            intensity: 'subtle',
            durationMs: 500,
          },
        },
        {
          id: '5',
          type: 'dialogue',
          characterId: 'heckler',
          line: "We're waiting for something funny.",
          parenthetical: null,
          delivery: 'flat',
          gesture: 'shrug',
        },
        {
          id: '6',
          type: 'beat',
          durationMs: 1000,
        },
        {
          id: '7',
          type: 'action',
          text: "Jack's eyes dart across the silent crowd.",
          narrate: false,
          camera: {
            move: 'whipPan',
            target: 'center',
            intensity: 'dramatic',
            durationMs: 800,
          },
        },
        {
          id: '8',
          type: 'music',
          action: 'start',
          mood: 'tense',
          intensity: 0.5,
          stinger: null,
        },
      ],
      outro: {
        style: 'holdOnActor',
        text: null,
      },
    },
  },
  {
    premise: 'A diver finds a city beneath the ice.',
    script: {
      version: '1.0',
      title: 'Beneath Ice',
      genre: 'scifi',
      mood: 'ominous',
      scene: {
        slugline: 'EXT. ARCTIC ICE - DAY',
        setting: 'desert',
        timeOfDay: 'day',
        weather: 'clear',
      },
      cast: [
        {
          id: 'diver',
          name: 'Eva',
          archetype: 'leader',
          build: 'average',
          voice: {
            register: 'mid',
            rate: 'normal',
          },
          entrance: {
            beat: 2,
            from: 'offLeft',
            style: 'walk',
          },
          silhouetteAccent: 'none',
        },
      ],
      beats: [
        {
          type: 'title',
          subtitle: 'Arctic Circle, 2050',
        },
        {
          type: 'slugline',
        },
        {
          type: 'action',
          text: 'Eva descends into icy waters, her scuba gear glistening in the pale sunlight.',
          narrate: true,
        },
        {
          type: 'dialogue',
          characterId: 'diver',
          line: "What's down here?",
          delivery: 'flat',
          gesture: 'none',
        },
        {
          type: 'beat',
          durationMs: 2000,
        },
        {
          type: 'reveal',
          text: "A city's spires pierce the darkness below.",
        },
      ],
      outro: {
        style: 'holdOnActor',
        text: 'The Discovery',
      },
    },
  },
  {
    premise: 'A bride receives a text from the groom who left ten years ago.',
    script: {
      version: '1.0',
      title: 'Lost Love',
      genre: 'romance',
      mood: 'melancholy',
      scene: {
        slugline: "INT. BRIDE'S APARTMENT - DAY",
        setting: 'apartment',
        timeOfDay: 'day',
        establishingText: '10 years later',
      },
      cast: [
        {
          id: 'bride',
          name: 'Emily',
          archetype: 'leader',
          build: 'slight',
          voice: {
            register: 'mid',
            rate: 'normal',
          },
          entrance: {
            beat: 0,
            from: 'already-present',
            style: 'walk',
          },
          exit: null,
          silhouetteAccent: null,
        },
      ],
      beats: [
        {
          id: 'beat1',
          type: 'slugline',
        },
        {
          id: 'beat2',
          type: 'action',
          text: 'Emily stares out the window, lost in thought.',
          narrate: false,
          camera: {
            move: 'pushIn',
            target: 'bride',
            intensity: 'subtle',
            durationMs: 2000,
          },
        },
        {
          id: 'beat3',
          type: 'action',
          text: 'Her phone buzzes with an incoming text.',
          narrate: false,
          holdMs: 500,
          music: {
            action: 'start',
            mood: 'melancholy',
            intensity: 0.5,
          },
        },
        {
          id: 'beat4',
          type: 'dialogue',
          characterId: 'bride',
          line: 'Oh my god.',
          parenthetical: 'whispering to herself',
          delivery: 'trembling',
          gesture: 'recoil',
          camera: {
            move: 'dollyIn',
            target: 'bride',
            intensity: 'dramatic',
            durationMs: 1000,
          },
        },
        {
          id: 'beat5',
          type: 'action',
          text: 'She reads the text, her eyes welling up with tears.',
          narrate: false,
          holdMs: 1000,
          lighting: {
            preset: 'warmInterior',
            transition: 'fade',
            durationMs: 500,
          },
        },
      ],
      outro: {
        style: 'holdOnActor',
        text: 'The Past Returns',
      },
    },
  },
]
