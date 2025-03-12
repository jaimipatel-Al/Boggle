<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useWord } from '@/composables/word'

const { dictionary } = useWord()

const ALPHABET = 'abcdefghijklmnopqrstuvwxyz'
const MIN_WORD_LENGTH = 3
const MAX_WORD_LENGTH = 4
const MAX_WORDS_TO_PLACE = 4

const size = ref<number>(5)
const board = ref<Cell[][]>([])
const correctWords = ref<string[]>([])
const selectedWord = ref<string>('')
const selectedCells = ref<CellPosition[]>([])

const totalScore = computed(() => {
  return correctWords.value.reduce((score, word) => {
    if (word.length === 2) return score + 1
    if (word.length === 3) return score + 2
    if (word.length === 4) return score + 3
    return score + 4
  }, 0)
})

const isSelected = (row: number, col: number): boolean => {
  return selectedCells.value.some((cell) => cell.row === row && cell.col === col)
}

const clearSelectedWord = (): void => {
  selectedWord.value = ''
  selectedCells.value = []
}

const markSelectedCells = (isCorrect: boolean): void => {
  selectedCells.value.forEach(({ row, col }) => {
    board.value[row][col].correct = isCorrect
    board.value[row][col].orangeBackground = isCorrect
  })
}

const isValidWord = (): boolean => {
  if (selectedCells.value.length < 2) return false

  const firstCell = selectedCells.value[0]
  const secondCell = selectedCells.value[1]

  if (firstCell.row === secondCell.row || firstCell.col === secondCell.col) return true

  alert('Please select cells in a valid format (horizontal or vertical).')
  return false
}

const selectingCell = (row: number, col: number): void => {
  const cellIndex = selectedCells.value.findIndex((cell) => cell.row === row && cell.col === col)

  if (cellIndex !== -1) {
    selectedCells.value.splice(cellIndex, 1)
    selectedWord.value =
      selectedWord.value.slice(0, cellIndex) + selectedWord.value.slice(cellIndex + 1)
  } else {
    selectedCells.value.push({ row, col })
    selectedWord.value += board.value[row][col].letter
  }
}

const submitWord = (): void => {
  if (selectedWord.value.length > 0 && isValidWord()) {
    const wordToSubmit = selectedWord.value.toLowerCase()

    if (dictionary.includes(wordToSubmit)) {
      correctWords.value.push(wordToSubmit)
      markSelectedCells(true)
    } else {
      markSelectedCells(false)
    }
  }
  clearSelectedWord()
}

const reset = (): void => {
  correctWords.value = []
  clearSelectedWord()
  initializeBoard()
}

const getRandomPosition = (
  wordLength: number,
  direction: 'horizontal' | 'vertical'
): CellPosition => {
  const maxRow = size.value - (direction === 'vertical' ? wordLength : 1)
  const maxCol = size.value - (direction === 'horizontal' ? wordLength : 1)
  return {
    row: Math.floor(Math.random() * (maxRow + 1)),
    col: Math.floor(Math.random() * (maxCol + 1)),
    direction,
  }
}

const canPlaceWord = (
  letters: string[],
  word: string,
  position: CellPosition,
  direction: 'horizontal' | 'vertical'
): boolean => {
  const { row, col } = position
  const wordLength = word.length

  if (direction === 'horizontal') {
    for (let i = 0; i < wordLength; i++) {
      const index = row * size.value + col + i
      if (letters[index] !== '' && letters[index] !== word[i]) return false
    }
  } else if (direction === 'vertical') {
    for (let i = 0; i < wordLength; i++) {
      const index = (row + i) * size.value + col
      if (letters[index] !== '' && letters[index] !== word[i]) return false
    }
  }
  return true
}

const placeWordOnBoard = (
  letters: string[],
  word: string,
  position: CellPosition,
  direction: 'horizontal' | 'vertical'
): void => {
  const { row, col } = position
  const wordLength = word.length

  if (direction === 'horizontal') {
    for (let i = 0; i < wordLength; i++) {
      letters[row * size.value + col + i] = word[i]
    }
  } else if (direction === 'vertical') {
    for (let i = 0; i < wordLength; i++) {
      letters[(row + i) * size.value + col] = word[i]
    }
  }
}

const initializeBoard = (): void => {
  const grid: string[] = Array(size.value * size.value).fill('')

  const filteredWords = dictionary
    .filter((word) => word.length >= MIN_WORD_LENGTH && word.length <= MAX_WORD_LENGTH)
    .sort(() => Math.random() - 0.5)
    .slice(0, MAX_WORDS_TO_PLACE)

  filteredWords.forEach((word) => {
    let placed = false
    while (!placed) {
      const direction = Math.random() > 0.5 ? 'horizontal' : 'vertical'
      const position = getRandomPosition(word.length, direction)
      if (canPlaceWord(grid, word, position, direction)) {
        placeWordOnBoard(grid, word, position, direction)
        placed = true
      }
    }
  })

  for (let i = 0; i < grid.length; i++) {
    if (grid[i] === '') {
      const randomIndex = Math.floor(Math.random() * ALPHABET.length)
      grid[i] = ALPHABET[randomIndex]
    }
  }

  board.value = wordArray(grid, size.value).map((row) =>
    row.map((letter) => ({ letter, correct: false, orangeBackground: false }))
  )
}

const wordArray = (array: string[], size: number): string[][] => {
  const result: string[][] = []
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size))
  }
  return result
}

onMounted(initializeBoard)
</script>

<template>
  <div class="flex p-3 flex-wrap">
    <h1 class="text-center w-full text-5xl font-bold m-10 text-gray-700">Boggle</h1>
    <div class="text-center flex-1">
      <div class="m-5">
        <label class="text-gray-800 text-xl">Select Grid Size : </label>
        <select
          v-model="size"
          @change="reset"
          class="border border-gray-400 rounded-md p-1 text-lg mx-3 w-40"
        >
          <option value="5">5x5</option>
          <option value="6">6x6</option>
        </select>
      </div>

      <div
        v-for="(row, i) in board"
        :key="i"
        :style="{ gridTemplateColumns: `repeat(${size}, 1fr)` }"
        class="w-fit grid gap-4 p-2 mx-auto bg-orange-200"
      >
        <div
          v-for="(cell, index) in row"
          :key="index"
          class="bg-white m-1 py-5 w-24 text-3xl font-semibold text-orange-900 border border-orange-200 cursor-pointer hover:bg-orange-100"
          :class="{
            selected: isSelected(i, index),
            correct: cell.correct,
            checked: cell.orangeBackground,
          }"
          @click="selectingCell(i, index)"
        >
          {{ cell.letter.toUpperCase() }}
        </div>
      </div>

      <div>
        <button
          type="button"
          @click="reset"
          class="m-5 rounded-md border border-orange-500 px-5 py-2.5 font-semibold text-lg text-orange-700 shadow-xs hover:bg-orange-500 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600"
        >
          Reset Table
        </button>
        <button
          type="button"
          class="m-5 rounded-md bg-orange-600 px-5 py-2.5 font-semibold text-lg text-white shadow-xs hover:bg-orange-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600"
          @click="submitWord"
        >
          Submit Word
        </button>
      </div>
    </div>

    <div class="flex-1">
      <div class="flex space-x-3">
        <h2 class="text-xl font-semibold mb-2">Selected Word :</h2>
        <p class="text-lg">{{ selectedWord }}</p>
      </div>

      <ul v-if="correctWords.length > 0">
        <li class="block text-xl font-semibold mb-2">Submitted Words :</li>
        <template class="flex flex-wrap">
          <li v-for="(word, i) in correctWords" :key="i" class="border border-gray-400 px-3 py-1.5">
            {{ word }}
          </li>
        </template>
      </ul>

      <div v-if="correctWords.length > 0">
        <h2 class="text-xl font-semibold mb-2">Total Score : {{ totalScore }}</h2>
      </div>
    </div>
  </div>
</template>

<style scoped>
.selected {
  background-color: #75ff75;
  color: #101010;
}

.correct.checked {
  background-color: #ff6262;
  color: white;
}
</style>
