import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const BRAVE_API_KEY = "BSALUZ3K2Ap12s2jtD4VdBVEQDgae_s";
export const CLAUDE_API_KEY =
  "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";

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
