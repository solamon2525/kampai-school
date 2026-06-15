/* data.js — คลังข้อมูลคำศัพท์ภาษาอังกฤษแยกประเภทของเกม Grammar Space Ranger */
window.GAME_DATA = {
  // สัญลักษณ์ไอเทมพิเศษตกสะสม
  ASTEROID: '☄️',
  SPREAD_ITEM: '⚡',
  SHIELD_ITEM: '🛡️',
  SLOW_ITEM: '⏱️',
  FEVER_ITEM: '💎',

  // คลังคำศัพท์แบ่งตามประเภทไวยากรณ์ (Parts of Speech)
  VOCABULARY: {
    nouns: {
      thai: 'คำนาม (Nouns)',
      list: [
        'cat', 'dog', 'doctor', 'teacher', 'school', 
        'house', 'apple', 'water', 'book', 'pencil', 
        'computer', 'friend', 'family', 'baby', 'city', 
        'country', 'train', 'plane', 'car', 'flower', 
        'tree', 'river', 'sea', 'mother', 'father'
      ]
    },
    verbs: {
      thai: 'คำกริยา (Verbs)',
      list: [
        'run', 'walk', 'jump', 'swim', 'fly', 
        'speak', 'talk', 'read', 'write', 'sing', 
        'dance', 'play', 'eat', 'drink', 'sleep', 
        'cook', 'draw', 'paint', 'watch', 'listen', 
        'drive', 'ride', 'climb', 'smile', 'laugh'
      ]
    },
    adjectives: {
      thai: 'คำคุณศัพท์ (Adjectives)',
      list: [
        'happy', 'sad', 'angry', 'cold', 'hot', 
        'big', 'small', 'tall', 'short', 'beautiful', 
        'ugly', 'good', 'bad', 'fast', 'slow', 
        'heavy', 'light', 'clean', 'dirty', 'rich', 
        'poor', 'old', 'young', 'sweet', 'sour'
      ]
    },
    adverbs: {
      thai: 'คำวิเศษณ์ (Adverbs)',
      list: [
        'quickly', 'slowly', 'happily', 'sadly', 'softly', 
        'loudly', 'easily', 'always', 'never', 'often', 
        'sometimes', 'yesterday', 'today', 'tomorrow', 'here', 
        'there', 'now', 'soon', 'well', 'carefully', 
        'quietly', 'politely', 'bravely', 'proudly', 'wildly'
      ]
    }
  }
};
