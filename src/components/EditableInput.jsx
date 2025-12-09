import { useState, useEffect, useRef } from 'react'

const EditableInput = ({
   value: initialValue,
   onSave,
   type = "text",
   className = "",
   placeholder = "",
   suffix = "",
   min, max
}) => {
   const [value, setValue] = useState(initialValue)

   useEffect(() => {
      setValue(initialValue)
   }, [initialValue])

   const handleChange = (e) => {
      const newValue = e.target.value
      setValue(newValue)

      if (type === 'number' && newValue === '') {
         return
      }

      onSave(newValue)
   }

   return (
      <div className="relative inline-block">
         <input
            type={type}
            value={value}
            min={min}
            max={max}
            onChange={handleChange}
            onMouseDown={(e) => e.stopPropagation()}
            placeholder={placeholder}
            className={`bg-transparent border-none outline-none focus:ring-0 p-0 m-0 w-full font-inherit ${className}`}
            style={{ appearance: 'textfield', MozAppearance: 'textfield' }}
         />
         {suffix && <span className="pointer-events-none">{suffix}</span>}
      </div>
   )
}

export default EditableInput