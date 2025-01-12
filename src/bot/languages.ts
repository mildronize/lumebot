// Prefer female character
const thaiLanguage = {
	start: "เริ่ม",
	yourAre: "คุณคือ",
	readingImage: "กำลังอ่านรูป",
	sorryICannotUnderstand: "ขอโทษด้วยค่ะ ฉันไม่เข้าใจที่คุณพิมพ์มา",
	sorryICannotUnderstandMessageType: "ขอโทษด้วยค่ะ ฉันไม่เข้าใจประเภทข้อความนี้ ตอนนี้ฉันสามารถเข้าใจแค่ข้อความและรูปภาพค่ะ",
} as const

const langConfig = {
	'th': thaiLanguage,
	'en': undefined, // English is not implemented yet
} as const;

// Default language is Thai
export const t = langConfig['th'];
