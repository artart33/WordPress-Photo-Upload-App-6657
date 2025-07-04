import React, { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { FiX, FiPlus, FiTag } from 'react-icons/fi'
import SafeIcon from '../common/SafeIcon'

const TagInput = ({ tags, onTagsChange, placeholder = "Voeg tags toe..." }) => {
  const [inputValue, setInputValue] = useState('')
  const [isInputFocused, setIsInputFocused] = useState(false)
  const inputRef = useRef(null)

  const handleInputChange = (e) => {
    setInputValue(e.target.value)
  }

  const handleInputKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag()
    } else if (e.key === 'Backspace' && inputValue === '' && tags.length > 0) {
      removeTag(tags.length - 1)
    }
  }

  const addTag = () => {
    const trimmedValue = inputValue.trim()
    if (trimmedValue && !tags.includes(trimmedValue)) {
      onTagsChange([...tags, trimmedValue])
      setInputValue('')
    }
  }

  const removeTag = (indexToRemove) => {
    onTagsChange(tags.filter((_, index) => index !== indexToRemove))
  }

  const handleInputBlur = () => {
    setIsInputFocused(false)
    if (inputValue.trim()) {
      addTag()
    }
  }

  const handleContainerClick = () => {
    inputRef.current?.focus()
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        <SafeIcon icon={FiTag} className="inline mr-2" />
        Tags
      </label>
      
      <div
        className={`min-h-[3rem] p-3 border rounded-lg bg-white cursor-text transition-all ${
          isInputFocused ? 'ring-2 ring-blue-500 border-transparent' : 'border-gray-300 hover:border-blue-400'
        }`}
        onClick={handleContainerClick}
      >
        <div className="flex flex-wrap gap-2">
          {tags.map((tag, index) => (
            <motion.span
              key={index}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
            >
              <SafeIcon icon={FiTag} className="text-xs" />
              {tag}
              <motion.button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  removeTag(index)
                }}
                className="ml-1 text-blue-600 hover:text-blue-800 hover:bg-blue-200 rounded-full p-0.5 transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <SafeIcon icon={FiX} className="text-xs" />
              </motion.button>
            </motion.span>
          ))}
          
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleInputKeyDown}
            onFocus={() => setIsInputFocused(true)}
            onBlur={handleInputBlur}
            placeholder={tags.length === 0 ? placeholder : ''}
            className="flex-1 min-w-[120px] outline-none bg-transparent text-sm"
          />
          
          {inputValue.trim() && (
            <motion.button
              type="button"
              onClick={addTag}
              className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium hover:bg-green-200 transition-colors"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <SafeIcon icon={FiPlus} className="text-xs" />
              Toevoegen
            </motion.button>
          )}
        </div>
      </div>
      
      <p className="text-xs text-gray-500">
        Typ een tag en druk op Enter of komma om toe te voegen. Gebruik tags voor specifieke trefwoorden.
      </p>
      
      {tags.length === 0 && (
        <div className="mt-2">
          <p className="text-xs text-gray-400 mb-2">Populaire tags:</p>
          <div className="flex flex-wrap gap-1">
            {['fotografie', 'reizen', 'natuur', 'landschap', 'architectuur', 'street', 'portret', 'zonsondergang'].map((suggestion) => (
              <motion.button
                key={suggestion}
                type="button"
                onClick={() => {
                  if (!tags.includes(suggestion)) {
                    onTagsChange([...tags, suggestion])
                  }
                }}
                className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {suggestion}
              </motion.button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default TagInput