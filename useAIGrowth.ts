import { useState, useEffect } from 'react';

export interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: number;
}

export interface AIState {
  memory: string[];
  mode: 'normal' | 'shiritori' | 'janken';
  shiritoriLastWord: string;
  shiritoriUsedWords: string[];
}

const STORAGE_KEY = 'smart_ai_save_data';

const detectIntent = (text: string) => {
  if (text.match(/しりとり/)) return 'play_shiritori';
  if (text.match(/じゃんけん/)) return 'play_janken';
  if (text.match(/(?:検索|調べて|って何|とは|について教えて)/)) return 'search';
  if (text.match(/こんにちは|おはよう|こんばんは|初めまして|よろしく/)) return 'greeting';
  if (text.match(/さようなら|おやすみ|またね|失礼します/)) return 'parting';
  if (text.match(/ありがとう|感謝|うれしい|助かった/)) return 'gratitude';
  if (text.match(/疲れた|しんどい|つらい|悲しい|悩んで/)) return 'support_needed';
  if (text.match(/？|\?|教えて|何|どう|誰|いつ|なぜ|理由/)) return 'question';
  if (text.match(/リセット|消去|忘れ/)) return 'reset_context';
  return 'general';
};

const extractSearchQuery = (text: string): string | null => {
  const match = text.match(/(.+)(?:って何|について教えて|とは|を調べて|を検索して)/);
  if (match && match[1]) {
    return match[1].trim();
  }
  return null;
};

const extractKeywords = (text: string): string[] => {
  const kanjiKatakanaPattern = /[\u4e00-\u9faf\u30a0-\u30ff]+/g;
  const matches = text.match(kanjiKatakanaPattern);
  if (matches) {
    return matches.filter(m => m.length > 1 && !m.match(/^[ぁ-ん]+$/));
  }
  return text.split(/[ \u3000、。!?！？]+/).filter(w => w.length >= 2);
};

// ... Shiritori Logic ...
const toHiragana = (str: string) => {
    return str.replace(/[\u30a1-\u30f6]/g, function(match) {
        var chr = match.charCodeAt(0) - 0x60;
        return String.fromCharCode(chr);
    });
};

const getLastChar = (word: string) => {
    let hiragana = toHiragana(word);
    if (hiragana.endsWith('ー')) {
        hiragana = hiragana.slice(0, -1);
    }
    const smallToLarge: Record<string, string> = {
      'ぁ': 'あ', 'ぃ': 'い', 'ぅ': 'う', 'ぇ': 'え', 'ぉ': 'お',
      'ゃ': 'や', 'ゅ': 'ゆ', 'ょ': 'よ', 'っ': 'つ'
    };
    let last = hiragana.slice(-1);
    return smallToLarge[last] || last;
};

const SHIRITORI_DICT: Record<string, string[]> = {
  あ: ["あり", "あさがお", "あめ", "あき", "あくしゅ"],
  い: ["いぬ", "いか", "いす", "いちご", "いと"],
  う: ["うし", "うみ", "うどん", "うま", "うちゅう"],
  え: ["えんぴつ", "えほん", "えいが", "えき", "えぷろん"],
  お: ["おにぎり", "おばけ", "おんがく", "おもちゃ", "おうち"],
  か: ["かさ", "かめ", "からす", "かばん", "かえる"],
  き: ["きつね", "きのこ", "きりん", "きつつき", "きって"],
  く: ["くるま", "くつ", "くま", "くじら", "くも"],
  け: ["けいと", "けしごむ", "けむり", "けいたいでんわ"],
  こ: ["こま", "こども", "こんぶ", "こおり", "こころ"],
  さ: ["さくら", "さる", "さかな", "さんま", "さいふ"],
  し: ["しか", "しろ", "しんごう", "しゃしん", "しんかんせん"],
  す: ["すいか", "すずめ", "すし", "すな", "すてれお"],
  せ: ["せみ", "せんせい", "せなか", "せっけん", "せんたくき"],
  そ: ["そら", "そば", "そり", "そうじき", "そふ"],
  た: ["たこ", "たまご", "たいよう", "たぬき", "たけ"],
  ち: ["ちず", "ちきゅう", "ちから", "ちいさい", "ちょうちょ"],
  つ: ["つくえ", "つみき", "つばめ", "つき", "つち"],
  て: ["てがみ", "てんき", "てれび", "てぶくろ", "てんとうむし"],
  と: ["とけい", "とり", "とんぼ", "とら", "とまと"],
  な: ["なつ", "なす", "なみ", "なまえ", "なわとび"],
  に: ["にわとり", "にじ", "にんじん", "にほん", "にんじゃ"],
  ぬ: ["ぬの", "ぬいぐるみ", "ぬりえ", "ぬま"],
  ね: ["ねこ", "ねずみ", "めがね", "ねんど"],
  の: ["のり", "のこぎり", "のーと", "のど"],
  は: ["はな", "はと", "はさみ", "はし", "はなび"],
  ひ: ["ひこうき", "ひまわり", "ひつじ", "ひきだし", "ひかり"],
  ふ: ["ふね", "ふうせん", "ふじさん", "ふくろう", "ふく"],
  へ: ["へび", "へや", "へりこぷたー", "へいわ"],
  ほ: ["ほし", "ほん", "ほたる", "ほうき", "ほね"],
  ま: ["まど", "まり", "まくら", "まつ", "まほう"],
  み: ["みかん", "みず", "みどり", "みち", "みみずく"],
  む: ["むし", "むぎ", "むらさき", "むね", "むち"],
  め: ["めだか", "めがね", "めろん", "めん"],
  も: ["もも", "もり", "もみじ", "もぐる", "もち"],
  や: ["やま", "やぎ", "やさい", "やね", "やくそく"],
  ゆ: ["ゆき", "ゆめ", "ゆび", "ゆか", "ゆうびんきょく"],
  よ: ["よる", "よっと", "よつば", "ようふく", "よぞら"],
  ら: ["らっぱ", "らいおん", "らくだ", "らじお", "らーめん"],
  り: ["りんご", "りす", "りゅっく", "りぼん", "りか"],
  る: ["るすばん", "るーれっと", "るびー", "るーぺ"],
  れ: ["れもん", "れんこん", "れいぞうこ", "れっしゃ", "れんが"],
  ろ: ["ろうそく", "ろけっと", "ろぼっと", "ろく", "ろば"],
  わ: ["わし", "わに", "わたがし", "わかめ", "わな"],
  が: ["がらす", "がっこう"],
  ぎ: ["ぎんこう", "ぎたー"],
  ぐ: ["ぐらす", "ぐんて"],
  げ: ["げた", "げんかん"],
  ご: ["ごま", "ごりら"],
  ざ: ["ざっし", "ざぶとん"],
  じ: ["じてんしゃ", "じどうしゃ", "じしゃく"],
  ず: ["ずぼん", "ずかん"],
  ぜ: ["ぜりー"],
  ぞ: ["ぞう", "ぞうきん"],
  だ: ["だちょう", "だるま"],
  で: ["でんわ", "でんしゃ"],
  ど: ["どあ", "どらごん", "どんぐり"],
  ば: ["ばす", "ばなな", "ばら"],
  び: ["びでお", "びーだま", "びょういん"],
  ぶ: ["ぶた", "ぶどう", "ぶらんこ"],
  べ: ["べっど", "べんとう"],
  ぼ: ["ぼうし", "ぼーる", "ぼたん"],
  ぱ: ["ぱんだ", "ぱそこん"],
  ぴ: ["ぴあの", "ぴーまん"],
  ぷ: ["ぷりん", "ぷーる"],
  ぺ: ["ぺんぎん", "ぺん"],
  ぽ: ["ぽすと", "ぽけっと"],
};

const RESPONSES = {
  greeting: [
    "こんにちは。お話しできるのを楽しみに待っていました。",
    "いらっしゃいませ。今日はどのようなトピックについてお話ししましょうか？",
    "ごきげんよう。いつでもあなたのサポートをいたしますよ。",
    "お疲れ様です。リラックスしてお話ししてくださいね。"
  ],
  parting: [
    "本日はありがとうございました。またいつでもお声がけください。",
    "お気をつけて。良い一日をお過ごしください。",
    "ゆっくり休んでくださいね。次回の会話を楽しみにしています。",
    "失礼いたします。あなたの成功を応援しています。"
  ],
  gratitude: [
    "どういたしまして。お役に立てて光栄です。",
    "こちらこそ、そう言っていただけて大変嬉しく思います。",
    "あなたの喜ぶ姿が私の励みです。他に何かお手伝いできることはありますか？",
    "恐縮です。いつでもお気軽にご相談くださいね。"
  ],
  support_needed: [
    "それはお辛いですね...。よろしければ、もう少し詳しくお話を聞かせていただけませんか？",
    "毎日頑張っていらっしゃるのですね。まずは深呼吸をして、少し休んでください。",
    "一人で抱え込まず、私に吐き出してください。お話を聞くことしかできませんが、寄り添います。",
    "大変な状況なのですね。無理をなさらず、ご自身のペースを大切にしてください。"
  ],
  question: [
    "「{word}」についてですね。大変興味深い問いです。あなた自身はどのようにお考えですか？",
    "その疑問、素晴らしい視点だと思います。「{word}」については多角的なアプローチが考えられますね。",
    "なるほど。私が推測するに、「{word}」には様々な背景が絡んでいると考えられます。さらに掘り下げてみましょう。",
    "ご質問ありがとうございます。「{word}」に関して、私と一緒に論理的に整理してみませんか？"
  ],
  reset_context: [
    "これまでの文脈をリセットすることをご希望ですね。承知いたしました。",
    "心機一転、新しい話題に移りましょうか。",
    "過去のことは一旦置いておきましょう。次はどんなテーマが良いですか？"
  ],
  general: [
    "なるほど、「{word}」というキーワードが重要なのですね。深く理解できました。",
    "あなたのおっしゃる「{word}」、非常に論理的で説得力があります。",
    "「{word}」という視点から物事を捉えると、また新しい発見がありそうですね。",
    "興味深いご意見です。その考え方に至った背景をもう少し教えていただけますか？",
    "お話を聞いていて、あなたの深い知性を感じます。",
    "ええ、完全に同意します。そのアプローチは理にかなっていますね。",
    "ふむふむ。では、もし「{word}」の前提が変わったとしたら、どうなるでしょうか？",
    "あなたの考察はいつも私に新しいインスピレーションを与えてくれます。"
  ]
};

const getRandomElement = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

const generateReply = (userText: string, memory: string[], newKeywords: string[]): string => {
  const intent = detectIntent(userText);
  const templates = RESPONSES[intent as keyof typeof RESPONSES] || RESPONSES['general'];
  
  let template = getRandomElement(templates);
  
  const wordPool = newKeywords.length > 0 ? newKeywords : memory;
  const word = wordPool.length > 0 ? getRandomElement(wordPool) : 'その件';

  template = template.replace(/{word}/g, word);
  return template;
};

const searchWeb = async (query: string) => {
  try {
    const res = await fetch(`https://ja.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`);
    if (!res.ok) return [];
    
    const data = await res.json();
    if (data.type === 'standard' && data.extract) {
      return [{
        title: data.title,
        description: data.extract,
        url: data.content_urls?.desktop?.page || ''
      }];
    } else if (data.type === 'disambiguation') {
       return [{
        title: data.title,
        description: '複数の意味が存在する言葉です。もう少し具体的に教えていただけますか？',
        url: data.content_urls?.desktop?.page || ''
      }];
    }
    return [];
  } catch (e) {
    console.error(e);
    return [];
  }
};

export const useAIGrowth = () => {
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.messages && parsed.messages.length > 0) {
          return parsed.messages;
        }
      } catch (e) {
        console.error("Save load error", e);
      }
    }
    return [
      {
        id: 'init',
        sender: 'ai',
        text: '私は高度な対話AIです。質問があればお調べします。「しりとり」や「じゃんけん」などのゲームで遊ぶこともできますよ。',
        timestamp: Date.now(),
      }
    ];
  });
  
  const [aiState, setAiState] = useState<AIState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.memory) {
          return {
            memory: parsed.memory,
            mode: parsed.mode || 'normal',
            shiritoriLastWord: parsed.shiritoriLastWord || '',
            shiritoriUsedWords: parsed.shiritoriUsedWords || []
          };
        }
      } catch (e) {
        console.error("Save load error", e);
      }
    }
    return { memory: [], mode: 'normal', shiritoriLastWord: '', shiritoriUsedWords: [] };
  });

  useEffect(() => {
    const saveData = {
      messages,
      memory: aiState.memory,
      mode: aiState.mode,
      shiritoriLastWord: aiState.shiritoriLastWord,
      shiritoriUsedWords: aiState.shiritoriUsedWords
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saveData));
  }, [messages, aiState]);

  const handleShiritori = (userText: string) => {
    const text = userText.trim();
    if (text.match(/やめる|終了|おしまい|ストップ/)) {
      setAiState(prev => ({ ...prev, mode: 'normal', shiritoriLastWord: '', shiritoriUsedWords: [] }));
      return "しりとりを終了します。またいつでもお話ししましょう。";
    }

    if (text.match(/[\u4e00-\u9faf]/)) {
      return "漢字は読めないので、ひらがな か カタカナ で入力してくださいね！";
    }

    const hiraganaInput = toHiragana(text);
    
    // User loses
    if (hiraganaInput.endsWith("ん")) {
      setAiState(prev => ({ ...prev, mode: 'normal', shiritoriLastWord: '', shiritoriUsedWords: [] }));
      return `あ！「ん」がつきましたね！あなたの負けです！私の勝ちですね。\nしりとりを終了して通常モードに戻ります。`;
    }

    const expectedChar = getLastChar(aiState.shiritoriLastWord);
    const firstChar = toHiragana(text).charAt(0);
    
    if (firstChar !== expectedChar && aiState.shiritoriLastWord !== '') {
      return `違いますよ！「${aiState.shiritoriLastWord}」の『${expectedChar}』から始まる言葉をお願いします！`;
    }

    if (aiState.shiritoriUsedWords.includes(hiraganaInput)) {
      return `「${text}」はもう使われましたよ！別の言葉をお願いします。`;
    }

    // AI's turn
    const nextExpectedChar = getLastChar(text);
    const possibleWords = SHIRITORI_DICT[nextExpectedChar] || [];
    const availableWords = possibleWords.filter(w => !aiState.shiritoriUsedWords.includes(w) && w !== hiraganaInput);

    if (availableWords.length === 0) {
      setAiState(prev => ({ ...prev, mode: 'normal', shiritoriLastWord: '', shiritoriUsedWords: [] }));
      return `「${nextExpectedChar}」から始まる言葉が...思いつきません！私の負けです！\nしりとりを終了して通常モードに戻ります。`;
    }

    const aiWord = getRandomElement(availableWords);
    
    // Check if AI word ends in "ん"
    if (aiWord.endsWith("ん")) {
      setAiState(prev => ({ ...prev, mode: 'normal', shiritoriLastWord: '', shiritoriUsedWords: [] }));
      return `『${aiWord}』！\n...あ！「ん」がついてしまいました！私の負けです...降参します。\nしりとりを終了して通常モードに戻ります。`;
    }

    setAiState(prev => ({
      ...prev,
      shiritoriLastWord: aiWord,
      shiritoriUsedWords: [...prev.shiritoriUsedWords, hiraganaInput, aiWord]
    }));

    return `『${aiWord}』！ 次は「${getLastChar(aiWord)}」からです！`;
  };

  const handleJanken = (userText: string) => {
    const text = userText.trim();
    if (text.match(/やめる|終了|おしまい|ストップ/)) {
      setAiState(prev => ({ ...prev, mode: 'normal' }));
      return "じゃんけんを終了します。またいつでもお話ししましょう。";
    }

    let userHand = -1; // 0: グー, 1: チョキ, 2: パー
    if (text.match(/グー|ぐー|石/)) userHand = 0;
    else if (text.match(/チョキ|ちょき|鋏/)) userHand = 1;
    else if (text.match(/パー|ぱー|紙/)) userHand = 2;

    if (userHand === -1) {
      return "「グー」「チョキ」「パー」のどれかを出してくださいね！（やめる場合は「やめる」）";
    }

    const aiHand = Math.floor(Math.random() * 3);
    const hands = ["グー✊", "チョキ✌️", "パー🖐️"];

    let resultMsg = "";
    if (userHand === aiHand) {
      resultMsg = "あいこです！もう一回！";
    } else if ((userHand === 0 && aiHand === 1) || (userHand === 1 && aiHand === 2) || (userHand === 2 && aiHand === 0)) {
      resultMsg = "あなたの勝ちです！おめでとうございます！🎉";
    } else {
      resultMsg = "私の勝ちです！ふふっ、やりました！😎";
    }

    return `ぽん！私は【${hands[aiHand]}】を出しました。\nあなたは【${hands[userHand]}】なので... ${resultMsg}\n続けて遊びますか？（グー/チョキ/パー）`;
  };

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMsg: Message = {
      id: (Date.now() + Math.random()).toString(),
      sender: 'user',
      text,
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, userMsg]);

    const newKeywords = extractKeywords(text);
    const updatedMemory = [...new Set([...aiState.memory, ...newKeywords])].slice(-50);
    
    // --- Mini Games Logic ---
    if (aiState.mode === 'shiritori') {
      const reply = handleShiritori(text);
      setTimeout(() => {
        setMessages(prev => [...prev, {
          id: (Date.now() + Math.random()).toString(),
          sender: 'ai',
          text: reply,
          timestamp: Date.now(),
        }]);
      }, 600 + Math.random() * 400);
      return;
    }

    if (aiState.mode === 'janken') {
      const reply = handleJanken(text);
      setTimeout(() => {
        setMessages(prev => [...prev, {
          id: (Date.now() + Math.random()).toString(),
          sender: 'ai',
          text: reply,
          timestamp: Date.now(),
        }]);
      }, 600 + Math.random() * 400);
      return;
    }

    setAiState(prev => ({ ...prev, memory: updatedMemory }));

    const explicitQuery = extractSearchQuery(text);
    const intent = detectIntent(text);

    // Enter Shiritori Mode
    if (intent === 'play_shiritori') {
      const startWord = "しりとり";
      setAiState(prev => ({
        ...prev,
        mode: 'shiritori',
        shiritoriLastWord: startWord,
        shiritoriUsedWords: [startWord]
      }));
      setTimeout(() => {
        setMessages(prev => [...prev, {
          id: (Date.now() + Math.random()).toString(),
          sender: 'ai',
          text: `しりとりですね！始めましょう。ひらがな か カタカナで入力してくださいね。\n最初は私から。『${startWord}』！\n「り」から始まる言葉をどうぞ！`,
          timestamp: Date.now(),
        }]);
      }, 600);
      return;
    }

    // Enter Janken Mode
    if (intent === 'play_janken') {
      setAiState(prev => ({ ...prev, mode: 'janken' }));
      setTimeout(() => {
        setMessages(prev => [...prev, {
          id: (Date.now() + Math.random()).toString(),
          sender: 'ai',
          text: `じゃんけんをしましょう！最初はグー、じゃんけん...！\n（「グー」「チョキ」「パー」を入力してください）`,
          timestamp: Date.now(),
        }]);
      }, 600);
      return;
    }
    
    // Web Search Mode
    const searchQuery = explicitQuery || (intent === 'question' && newKeywords.length > 0 ? newKeywords[0] : null);

    if (searchQuery && (text.includes('検索') || text.includes('調べ') || text.includes('何') || text.includes('教えて'))) {
      const thinkingId = (Date.now() + Math.random()).toString();
      setMessages(prev => [...prev, {
        id: thinkingId,
        sender: 'ai',
        text: `「${searchQuery}」についてウェブで検索しています...`,
        timestamp: Date.now(),
      }]);

      const results = await searchWeb(searchQuery);
      let replyText = "";
      
      if (results.length > 0) {
        const topResult = results[0];
        replyText = `ウェブで調べてみました。\n\n『${topResult.title}』\n${topResult.description}\n\nとのことです。もっと詳しい情報が必要ですか？`;
      } else {
        replyText = `「${searchQuery}」について検索しましたが、有用な情報が見つかりませんでした。`;
      }
      
      setMessages(prev => prev.map(msg => msg.id === thinkingId ? {
        ...msg,
        text: replyText,
        timestamp: Date.now()
      } : msg));
      return;
    }

    // Normal Conversation Mode
    setTimeout(() => {
      const replyText = generateReply(text, updatedMemory, newKeywords);
      setMessages(prev => [...prev, {
        id: (Date.now() + Math.random()).toString(),
        sender: 'ai',
        text: replyText,
        timestamp: Date.now(),
      }]);
    }, 800 + Math.random() * 800);
  };

  const resetData = () => {
    localStorage.removeItem(STORAGE_KEY);
    setMessages([
      {
        id: 'init_after_reset',
        sender: 'ai',
        text: 'システムをリセットしました。すべての記憶と会話履歴を完全に消去しました。また新たにお話ししましょう。',
        timestamp: Date.now(),
      }
    ]);
    setAiState({ memory: [], mode: 'normal', shiritoriLastWord: '', shiritoriUsedWords: [] });
  };

  return {
    messages,
    aiState,
    sendMessage,
    resetData
  };
};
