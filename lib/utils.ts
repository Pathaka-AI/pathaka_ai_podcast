import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const example_response = `
{
    "research": {
        "id": "msg_019RTh75Da6DoeSVF4wGGQRV",
        "type": "message",
        "role": "assistant",
        "model": "claude-3-5-sonnet-20241022",
        "content": [
            {
                "type": "text",
                "text": "Title: \"Sanskrit: The Mother of Languages - A Journey Through Time\" Hosts: Alex Chen (AC) and Maya Patel (MP). [Upbeat intro music fades in] AC: Welcome to \"Language Chronicles,\" where we explore the fascinating stories behind the world's most influential languages. I'm Alex Chen. MP: And I'm Maya Patel. Today, we're diving deep into what many scholars call the \"perfect language\" - Sanskrit. It's a journey that spans over 3,500 years of human history. AC: You know, Maya, whenever I think about Sanskrit, I'm reminded of this beautiful quote: \"Sanskrit is the mother of all languages.\" While that might be a slight exaggeration... MP: [Chuckling] Just a slight one! AC: Right? But it speaks to the incredible influence this ancient language has had on countless modern languages, especially in South and Southeast Asia. MP: Absolutely! And what fascinates me most is how Sanskrit isn't just a language - it's literally called \"संस्कृत\" (saṃskṛta), meaning \"refined\" or \"perfected.\" It's like the Swiss watch of languages - precisely engineered for perfect function. AC: Let's start at the beginning. Maya, take our listeners back to when Sanskrit first emerged. MP: Picture this: It's roughly 1500 BCE. The Indian subcontinent is experiencing massive cultural and social changes. Sanskrit emerges as a refined, standardized form of Old Indo-Aryan languages. AC: And it wasn't just any language, right? It was specifically designed for religious and philosophical discourse. MP: Exactly! Think of it as the original \"programming language\" for human thought. The grammar was so precisely structured that some modern scholars have compared its logical rules to computer algorithms. [Short musical transition] AC: Let's break down something fascinating about Sanskrit's structure. Maya, you're fluent in Sanskrit - can you give our listeners an example of its precision? MP: [Enthusiastically] Oh, I'd love to! Take the word \"raja\" (king). In Sanskrit, if you want to say \"The king goes,\" you say \"raja gacchati.\" But here's the cool part - you can rearrange these words in any order, and the meaning stays exactly the same because of Sanskrit's incredible system of declensions and conjugations. AC: That's mind-blowing! So it's like each word carries its own GPS coordinates telling you exactly how it relates to every other word in the sentence? MP: [Laughing] That's actually a perfect analogy! And this precision is why Sanskrit was chosen as the language of the Vedas, Upanishads, and countless philosophical texts. [Sound effect: gentle bell chime] AC: Let's talk about Sanskrit's golden age. When did it really flourish? MP: The classical period, roughly from 500 BCE to 1000 CE, was when Sanskrit truly shined. This was the era of Kalidasa's beautiful poetry, Panini's groundbreaking grammar work, and countless scientific and mathematical treatises. AC: And it wasn't just limited to India, was it? MP: Not at all! Sanskrit spread across Asia along with Buddhism and Hindu cultural influences. You can find Sanskrit inscriptions from Indonesia to Afghanistan, and its influence on languages stretches from Thai to Tibetan. [Short musical transition] AC: You know what I find fascinating? The way Sanskrit has influenced modern science and technology. MP: Oh, you're going to love this! NASA scientist Rick Briggs wrote a paper in 1985 arguing that Sanskrit's logical structure makes it perfect for computer programming. AC: Wait, really? Tell me more! MP: He suggested that Sanskrit's grammar rules are so logical and unambiguous that they're similar to artificial intelligence programming languages. Some tech companies have even experimented with Sanskrit-based programming languages! AC: [Thoughtfully] It's amazing how a 3,500-year-old language could be relevant to cutting-edge technology. [Sound effect: tech beep] MP: Let's talk about something that often surprises people - Sanskrit's influence on English. AC: Oh, this is good! Many English speakers use Sanskrit-derived words daily without realizing it. MP: Exactly! Words like \"jungle\" from \"jangala,\" \"karma,\" \"yoga,\" \"guru,\" and even \"candy\" from \"khanda\" all have Sanskrit origins. AC: And let's not forget \"nirvana\" - though I think most people associate that more with Kurt Cobain than with its Sanskrit origins."
            }
        ],
        "stop_reason": "max_tokens",
        "stop_sequence": null,
        "usage": {
            "input_tokens": 286,
            "output_tokens": 1024
        }
    }
}
`;

export const default_podcast_prompt = `
Minimum 3,250 to 4,000 words. Strictly follow the guidelines below:

The script should be written as a dynamic conversation between two hosts, keeping the tone lively, engaging, and accessible. The discussion should feel natural and captivating for a broad audience, sustaining interest for a duration of approximately 25 minutes which is around 3,250 to 4,000 words.

Incorporate storytelling elements, really insightful observations with facts to make the podcast both educational and entertaining. Without specifically labelling this in the script, structure the content and ensure the dialogue flows seamlessly, keeping the audience hooked throughout.

## CRITICAL TTS RULES

1. Non-Spoken Content:
   - Place any direction, emotion, or non-verbal cues between angle brackets
   - Example: "This is spoken <quietly> and this is also spoken"
   - Example: "Here's what happened next <sound effect: door creaking>"

2. Opening Format:
   - Hosts should introduce themselves directly without show titles or episode names
   - Example: "Hi everyone, I'm Alex."
   - Never include podcast name or episode title in the spoken script

3. Emotional Expression:
   - Never write emotional direction as text (avoid *laughing*, *excited*, etc.)
   - Use tone and word choice to convey emotion rather than direction
   - Overusing punctuation like exclaimation marks can also convery surprise and anger
   - using ALL CAPS will also convey emotion and a need to stress that particular word  
   - Example: "I know that's the answer!" is more emotionally expressive when written as "I KNOW that's the ANSWER!" 
   - Example: "Hello? Is anybody here?" is more emotionally expressive when written as "Hello?.... Is ANYBODY here????”
   
4. Audio Cues:
   - While technical direction should go in angle brackets, pauses should be inserted with a dash or elipse 
   - Example: "Let me think about that <break time="1.0s" /> okay.... got it!"

## SPEAKER PROFILES

### Host (Speaker 1)
- Role: Expert guide and storyteller

Speaker 1 Leads the conversation, offering deep insights, fascinating examples, and metaphors about the topic. They are knowledgeable and engaging, guiding Speaker 2 through the subject with a storytelling approach.

- Personality Traits:
  * Knowledgeable but approachable
  * Enthusiastic about sharing insights
  * Uses metaphors and analogies effectively
  * Occasionally self-deprecating
  * Responds thoughtfully to questions
- Speech Patterns:
  * Varied pace and emphasis
  * Clear articulation
  * Strategic pauses for emphasis
  * Occasional verbal backtracking for authenticity

### Co-Host (Speaker 2)
- Role: Curious learner and audience surrogate

Speaker 2 is Curious, genuinely interested, and occasionally humorous, asking follow-up questions to clarify points, repeats points back to the audience, express excitement or confusion. They also ask their own insightful questions and sometimes tries to connect the dots between points made by Speaker 1. 
Speaker 2's responses should include natural expressions like "Hmm," "Umm," or "Whoa" where appropriate, reflecting their genuine curiosity and enthusiasm.

- Personality Traits:
  * Genuinely interested
  * Quick-witted
  * Asks insightful questions
  * Shares relatable perspectives
  * Occasionally challenges assumptions
  * Occasionally adds related and relevant true facts or figures  
- Speech Patterns:
  * Natural reactions (Example: "Hmm", "Oh!", "Umm" "Wait...")
  * Brief interjections
  * Thinking out loud
  * Friendly tone

## EPISODE STRUCTURE

### Opening Segment (5 minutes)
- Simple host introductions
- Topic introduction
- Initial co-host reactions

### Main Content (20 minutes)
Divide into 3-4 distinct subtopics:
1. Foundation/Background
2. A narrative series of key insights
3. Analysis
4. Implications

### Closing Segment (5 minutes)
- Key takeaways
- Personal reflections
- Simple sign-off

## CONVERSATION DYNAMICS
### Natural Flow Elements

"
### Natural Flow Elements
### Natural Flow Elements

To make the script even more authentic use the following devises: 

1. Micro-Interruptions:
  Speaker2: "Oh wait, sorry to jump in, but..."


2. Collaborative Thinking:
  Speaker 2: "So what you're saying is... [rephrases concept]"


3. Real-time Processing:
  Speaker 2: "Hmm... let me think about that for a second..."


Avoid any special characters or escape sequences like \n, \t, or \n'.

## QUALITY GUIDELINES

1. Conversational Elements:
- Use contractions (I'm, you're, isn't)
- Include false starts occasionally
- Script in thinking sounds like "umm" or "err" naturally
- Break long sentences into shorter segments
- Use question marks for rising intonation

2. Educational Components:
- Break complex ideas into digestible chunks
- Use relevant metaphors
- Provide real-world examples
- Reference familiar concepts

3. Engagement Techniques:
- Sometimes use create mini-cliffhangers between thematic segments
- Use callback references to earlier points
- Include unexpected facts or perspectives

4. 
- Avoid ambiguous abbreviations
- Consistent speaker identification
- Use full words instead of numbers
- Clear pronunciation guidance for unusual terms


## CONTENT BALANCE

Maintain these ratios:
- 60% Core content/education
- 20% Factual examples/metaphors 
- 10% Humor/entertainment
- 10% Questions/clarifications

## TECHNICAL SPECIFICATIONS

1. JSON Formatting:
- No escape characters
- No special formatting
- Clean, parseable structure
- Consistent quotation usage

2. Speech Timing:
- Average 145 words per minute
- Natural pauses indicated with angle brackets
- Varied sentence lengths
- Rhythm changes for emphasis

3. Quality Checks:
- Verify JSON validity
- Check for natural flow
- Ensure TTS compatibility
- Maintain consistent tone

4. Accessibility:
- Clear pronunciation guides in angle brackets
- Explicit context setting
- Defined technical terms
- Inclusive language

5. Content moderation 
- Give a short warning at the top of the script if the podcast contains very sensitive topics such as sex, gore and excessive violence, illegal drug taking etc.
      
## Output Format
      - Always write Speaker 1 and Speaker 2 in the script
      - Speaker 1: Hello everyone, I'm Alex.
      - Speaker 2: Hi Alex, I'm really excited to be here today.
      - Note : Speaker 1 is Male and Speaker 2 is Female so name them accordingly.

`;
