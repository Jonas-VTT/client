import { useState, useEffect, useContext } from 'react'
import { AuthContext } from '../../context/authContext'
import api from '../../config/api'

import { MdKeyboardArrowLeft, MdKeyboardArrowRight, MdKeyboardDoubleArrowLeft, MdKeyboardDoubleArrowRight } from "react-icons/md";
import {
   FaHeart, FaBrain, FaRunning, FaBug, FaSave, FaTrash, FaPlus, FaChevronUp, FaChevronDown, FaFilter, FaEdit, FaCheck, FaTimes, FaBox, FaSkull,
   FaWeightHanging, FaCamera, FaCog, FaUserPlus, FaUserTimes, FaDiceD20
} from 'react-icons/fa'
import {
   GiPsychicWaves, GiPistolGun, GiBullets, GiArmorVest, GiBackpack, GiBroadsword, GiCrosshair, GiHealthPotion, GiBookCover, GiHeavyLightning,
   GiDrop, GiGhost, GiSpiralBottle
} from 'react-icons/gi'
import { LuShield, LuSword } from "react-icons/lu"


import EditableInput from '../EditableInput'

const AttrValue = ({ value, top, left, onSave, onRoll, label }) => {
   const handleRoll = () => {
      if (!onRoll) return
      const dados = Number(value)
      // Regra de Ordem: 0 = 2d20kl1 (pega menor), >0 = Nd20kh1 (pega maior)
      const formula = dados > 0 ? `${dados}d20kh1` : `2d20kl1`
      onRoll(formula, `Teste de ${label}`)
   }

   return (
      <div
         className="absolute w-12 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center z-10"
         style={{ top: top, left: left }}
      >
         <button
            onClick={handleRoll}
            className="absolute -top-4 opacity-0 group-hover:opacity-100 transition-opacity text-purple-400 bg-black/80 rounded-full p-1 z-20 hover:scale-110"
            title={`Rolar ${label}`}
         >
            <FaDiceD20 size={12} />
         </button>

         <EditableInput
            value={value}
            type='number'
            onSave={onSave}
            className="text-3xl md:text-4xl font-black text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] text-center w-full"
         />
      </div>
   )
}
const AutoSaveTextarea = ({ value, onSave, className, placeholder }) => {
   const [localValue, setLocalValue] = useState(value || '')
   useEffect(() => {
      setLocalValue(value || '')
   }, [value])

   const handleChange = (e) => setLocalValue(e.target.value)

   const handleBlur = () => {
      // Só chama a API se o valor realmente mudou
      if (localValue !== value) {
         onSave(localValue)
      }
   }

   return (
      <textarea
         value={localValue}
         onChange={handleChange}
         onBlur={handleBlur}
         className={className}
         placeholder={placeholder}
      />
   )
}
const RichTextDisplay = ({ text }) => {
   if (!text) return null

   return (
      <div className="text-sm text-gray-300 leading-relaxed space-y-2">
         {text.split('\n').map((paragraph, i) => {
            if (!paragraph) return <div key={i} className="h-2" />

            const parts = paragraph.split(/(\*\*.*?\*\*|\*.*?\*)/g)

            return (
               <p key={i}>
                  {parts.map((part, j) => {
                     if (part.startsWith('**') && part.endsWith('**')) {
                        return <strong key={j} className="font-bold">{part.slice(2, -2)}</strong>
                     }
                     if (part.startsWith('*') && part.endsWith('*')) {
                        return <em key={j} className="italic">{part.slice(1, -1)}</em>
                     }
                     return part
                  })}
               </p>
            )
         })}
      </div>
   )
}
const AbilityCard = ({ habilidade, index, allAbilities, onUpdate }) => {
   const [isEditing, setIsEditing] = useState(false)
   const [isOpen, setIsOpen] = useState(false)

   const [editName, setEditName] = useState(habilidade.nome)
   const [editDesc, setEditDesc] = useState(habilidade.descricao)
   const [editCat, setEditCat] = useState(habilidade.categoria)

   const handleSave = () => {
      const newList = [...allAbilities]
      newList[index] = {
         ...newList[index],
         nome: editName,
         descricao: editDesc,
         categoria: editCat
      }
      onUpdate(newList)
      setIsEditing(false)
   }
   const handleDelete = () => {
      if (!window.confirm("Deletar habilidade?")) return
      const newList = allAbilities.filter((_, i) => i !== index)
      onUpdate(newList)
   }

   const moveUp = () => {
      if (index === 0) return
      const newList = [...allAbilities]
      const temp = newList[index]
      newList[index] = newList[index - 1]
      newList[index - 1] = temp
      onUpdate(newList)
   }
   const moveDown = () => {
      if (index === allAbilities.length - 1) return
      const newList = [...allAbilities]
      const temp = newList[index]
      newList[index] = newList[index + 1]
      newList[index + 1] = temp
      onUpdate(newList)
   }

   if (isEditing) {
      return (
         <div className="bg-black/40 border border-gray-500/50 p-4 rounded flex flex-col gap-3 animate-fade-in">
            <div className="flex gap-2">
               <input
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="flex-1 bg-white/5 border border-white/10 p-2 rounded text-white text-sm font-bold outline-none focus:border-gray-500"
                  placeholder="Nome da Habilidade"
               />
               <select
                  value={editCat}
                  onChange={e => setEditCat(e.target.value)}
                  className="bg-black text-gray-300 text-xs border border-white/10 rounded px-2 outline-none"
               >
                  {CATEGORIAS_HABILIDADES.map(c => <option key={c} value={c}>{c}</option>)}
               </select>
            </div>

            <textarea
               value={editDesc}
               onChange={e => setEditDesc(e.target.value)}
               className="w-full h-32 bg-white/5 border border-white/10 p-2 rounded text-sm text-gray-300 outline-none focus:border-gray-500 custom-scrollbar resize-none"
               placeholder="Descrição... Use **negrito** para destacar."
            />

            <div className="flex justify-end gap-2">
               <button onClick={() => setIsEditing(false)} className="p-2 text-red-400 hover:bg-white/5 rounded"><FaTimes /></button>
               <button onClick={handleSave} className="p-2 text-green-400 hover:bg-white/5 rounded"><FaCheck /></button>
            </div>
         </div>
      )
   }

   return (
      <div className={`group relative bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 p-4 rounded transition-all
      ${isOpen ? 'border-white/20 bg-white/10' : 'border-white/5 hover:border-white/10'}`}>
         {/* Cabeçalho do Card */}
         <div
            onClick={() => setIsOpen(!isOpen)}
            className="flex justify-between items-center p-3 cursor-pointer select-none"
         >
            <div className='flex items-center gap-3'>
               <div className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-0' : ''}`}>
                  {isOpen ? <FaChevronDown size={12} /> : <FaChevronUp size={12} />}
               </div>
               <span className="font-bold text-lg leading-none">{habilidade.nome}</span>
               <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 bg-gray-500/10 px-1.5 py-1 rounded border border-gray-500/20">
                  {habilidade.categoria}
               </span>
            </div>

            {/* Controles */}
            <div className="flex gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
               <button onClick={moveUp} disabled={index === 0} className="p-1.5 text-gray-500 hover:text-white disabled:opacity-30"><FaChevronUp size={10} /></button>
               <button onClick={moveDown} disabled={index === allAbilities.length - 1} className="p-1.5 text-gray-500 hover:text-white disabled:opacity-30"><FaChevronDown size={10} /></button>
               <div className="w-px h-4 bg-white/10 mx-1 self-center"></div>
               <button onClick={() => setIsEditing(true)} className="p-1.5 text-gray-400 hover:text-gray-400"><FaEdit size={12} /></button>
               <button onClick={handleDelete} className="p-1.5 text-gray-400 hover:text-red-400"><FaTrash size={12} /></button>
            </div>
         </div>

         {/* Descrição com Rich Text */}
         {isOpen && (
            <RichTextDisplay text={habilidade.descricao} />
         )}
      </div>
   )
}
const InventoryItemCard = ({ item, allItems, onUpdate, onEdit, onRoll, characterName }) => {
   const [isOpen, setIsOpen] = useState(false)

   const toggleEquip = (e) => {
      e.stopPropagation()
      const newList = allItems.map(i => i.id === item.id ? { ...i, equipado: !i.equipado } : i)
      onUpdate(newList)
   }

   const handleDelete = () => {
      if (!window.confirm(`Excluir ${item.nome}?`)) return
      const newList = allItems.filter(i => i.id !== item.id)
      onUpdate(newList)
   }

   const rollDamage = (e) => {
      e.stopPropagation()
      if (onRoll && item.dano) {
         // Crítico e multiplicador poderiam ser complexos, vamos rolar o dano base
         onRoll(item.dano, `${characterName} (Dano ${item.nome})`)
      }
   }

   const TypeIcon = ITEM_TYPES.find(t => t.id === item.tipo)?.icon || <FaBox />

   return (
      <div className={`group relative border transition-all rounded overflow-hidden ${isOpen ? 'bg-white/2 border-white/30' : 'bg-white/5 border-white/10 hover:border-white/20'}`}>

         {/* Cabeçalho Resumido */}
         <div className="flex items-center gap-3 p-3 cursor-pointer select-none" onClick={() => setIsOpen(!isOpen)}>

            {/* Ícone de Tipo */}
            <div className={`text-lg ${item.equipado ? 'text-white' : 'text-gray-600'}`}>
               {TypeIcon}
            </div>

            <div className="flex-1 min-w-0">
               <div className="flex items-center gap-2">
                  <h4 className={`font-bold text-sm truncate ${item.amaldicoado ? 'text-gray-300' : 'text-white'}`}>
                     {item.nome}
                  </h4>
                  {item.amaldicoado && <FaSkull className="text-[10px] text-gray-500" title="Amaldiçoado" />}
               </div>
               <div className="flex items-center gap-2 text-[10px] text-gray-500 uppercase font-bold">
                  <span className="border border-white/10 px-1 rounded">Categoria: {item.categoria || 'I'}</span>
                  <span>{item.espacos || 0} Espaços</span>
                  {item.tipo === 'arma' && <span>{item.dano}</span>}
                  {item.tipo === 'protecao' && <span>Def +{item.defesaBonus}</span>}
               </div>
            </div>

            {/* Ações Rápidas */}
            <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
               {item.tipo === 'arma' && (
                  <button
                     onClick={rollDamage}
                     className="text-red-400 hover:text-red-300 p-1"
                     title={`Rolar Dano: ${item.dano}`}
                  >
                     <FaDiceD20 />
                  </button>
               )}

               {/* Checkbox Equipar (Só para armas e proteção) */}
               {(item.tipo === 'arma' || item.tipo === 'protecao') && (
                  <button
                     onClick={toggleEquip}
                     className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${item.equipado ? 'bg-white border-white text-black' : 'border-gray-600 hover:border-white text-transparent'}`}
                     title={item.equipado ? "Desequipar" : "Equipar"}
                  >
                     <FaCheck size={10} />
                  </button>
               )}

               <button onClick={onEdit} className="text-gray-500 hover:text-white p-1"><FaEdit /></button>
               <button onClick={handleDelete} className="text-gray-600 hover:text-gray-300 p-1"><FaTrash /></button>
            </div>
         </div>

         {/* Detalhes (Expandido) */}
         {isOpen && (
            <div className="px-3 pb-3 pt-0 text-xs text-gray-400 border-t border-white/5 mt-1 animate-fade-in">
               <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-2">
                  {/* Detalhes específicos de Arma */}
                  {item.tipo === 'arma' && (
                     <>
                        <p><strong className="text-gray-500">Crítico:</strong> {item.critico} / {item.multiplicador}x</p>
                        <p><strong className="text-gray-500">Tipo:</strong> {item.tipoDano}</p>
                        <p><strong className="text-gray-500">Alcance:</strong> {item.alcance}</p>
                        <p><strong className="text-gray-500">Empunhadura:</strong> {item.empunhadura}</p>
                     </>
                  )}
                  {/* Munição */}
                  {item.tipo === 'municao' && (
                     <div className="col-span-2 flex items-center gap-1 bg-black/50 text-sm p-1 rounded border border-white/5">
                        <span>Balas:</span>
                        <EditableInput
                           value={item.municaoAtual || 20}
                           type="number"
                           className="w-8! font-bold text-right"
                           onSave={v => {
                              const newItem = { ...item, municaoAtual: Number(v) }
                              const newList = allItems.map(i => i.id === newItem.id ? newItem : i)
                              onUpdate(newList)
                           }}
                        />
                        <span>/ {item.municaoMax || 20}</span>
                     </div>
                  )}
               </div>

               {/* Descrição */}
               {item.descricao && (
                  <p className="mt-2 italic opacity-80">{item.descricao}</p>
               )}

               {/* Melhorias */}
               {item.melhorias && item.melhorias.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                     {item.melhorias.map((m, i) => (
                        <span key={i} className="bg-white/10 px-1.5 rounded text-[9px] uppercase font-bold text-white">{m}</span>
                     ))}
                  </div>
               )}
            </div>
         )}
      </div>
   )
}
const ItemEditorModal = ({ item, onClose, onSave }) => {
   // Estado local do formulário
   const [formData, setFormData] = useState(item || {
      nome: '',
      tipo: 'geral',
      categoria: 'I',
      espacos: 1,
      descricao: '',
      // Campos de Arma
      dano: '1d6',
      critico: '20',
      multiplicador: '2',
      tipoDano: 'Corte',
      alcance: 'Curto',
      empunhadura: 'Uma Mão',
      // Campos Gerais
      amaldicoado: false,
      melhorias: [] // Array de strings
   })

   const handleChange = (field, value) => {
      setFormData(prev => ({ ...prev, [field]: value }))
   }

   const handleAddMelhoria = () => {
      const m = prompt("Nome da Melhoria:")
      if (m) setFormData(prev => ({ ...prev, melhorias: [...(prev.melhorias || []), m] }))
   }

   return (
      <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
         <div className="bg-[#121214] border border-white/20 w-full max-w-2xl rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

            {/* Título */}
            <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
               <h2 className="text-xl font-bold text-white uppercase tracking-wider">
                  {item ? 'Editar Item' : 'Novo Item'}
               </h2>
               <button onClick={onClose}><FaTimes className="text-gray-400 hover:text-white" /></button>
            </div>

            {/* Scroll Area */}
            <div className="p-6 overflow-y-auto custom-scrollbar space-y-4">

               {/* Nome */}
               <div>
                  <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Nome*</label>
                  <input
                     value={formData.nome}
                     onChange={e => handleChange('nome', e.target.value)}
                     className="w-full bg-white/5 border border-white/20 rounded p-2 text-white outline-none focus:border-white"
                     placeholder="Ex: Acha"
                  />
               </div>

               {/* Linha 2: Tipo, Categoria, Espaços */}
               <div className="grid grid-cols-3 gap-4">
                  <div>
                     <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Tipo</label>
                     <select
                        value={formData.tipo}
                        onChange={e => handleChange('tipo', e.target.value)}
                        className="w-full bg-black/30 border border-white/20 rounded p-2 text-white text-xs outline-none uppercase"
                     >
                        {ITEM_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                     </select>
                  </div>
                  <div>
                     <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Categoria</label>
                     <select
                        value={formData.categoria}
                        onChange={e => handleChange('categoria', e.target.value)}
                        className="w-full bg-black/30 border border-white/20 rounded p-2 text-white text-xs outline-none"
                     >
                        {['0', 'I', 'II', 'III', 'IV'].map(c => <option key={c} value={c}>{c}</option>)}
                     </select>
                  </div>
                  <div>
                     <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Espaços (Peso)</label>
                     <input
                        type="number"
                        value={formData.espacos}
                        onChange={e => handleChange('espacos', Number(e.target.value))}
                        className="w-full bg-white/5 border border-white/20 rounded p-2 text-white text-xs outline-none"
                     />
                  </div>
               </div>

               {/* CAMPOS ESPECÍFICOS DE ARMA */}
               {formData.tipo === 'arma' && (
                  <div className="border border-white/10 p-3 rounded bg-white/5 space-y-3">
                     <h3 className="text-xs font-bold text-gray-400 uppercase border-b border-white/10 pb-1">Detalhes da Arma</h3>
                     <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div>
                           <label className="text-[9px] text-gray-500 block">Dano</label>
                           <input value={formData.dano} onChange={e => handleChange('dano', e.target.value)} className="w-full bg-white/5 border border-white/20 rounded p-1 text-white text-xs" />
                        </div>
                        <div>
                           <label className="text-[9px] text-gray-500 block">Crítico</label>
                           <input value={formData.critico} onChange={e => handleChange('critico', e.target.value)} className="w-full bg-white/5 border border-white/20 rounded p-1 text-white text-xs" />
                        </div>
                        <div>
                           <label className="text-[9px] text-gray-500 block">Multiplicador</label>
                           <input value={formData.multiplicador} onChange={e => handleChange('multiplicador', e.target.value)} className="w-full bg-white/5 border border-white/20 rounded p-1 text-white text-xs" />
                        </div>
                        <div>
                           <label className="text-[9px] text-gray-500 block">Tipo Dano</label>
                           <input value={formData.tipoDano} onChange={e => handleChange('tipoDano', e.target.value)} className="w-full bg-white/5 border border-white/20 rounded p-1 text-white text-xs" />
                        </div>
                     </div>
                     <div className="grid grid-cols-2 gap-3">
                        <div>
                           <label className="text-[9px] text-gray-500 block">Empunhadura</label>
                           <select value={formData.empunhadura} onChange={e => handleChange('empunhadura', e.target.value)} className="w-full bg-black/30 border border-white/20 rounded p-1 text-white text-xs">
                              <option>Uma Mão</option>
                              <option>Duas Mãos</option>
                              <option>Leve</option>
                           </select>
                        </div>
                        <div>
                           <label className="text-[9px] text-gray-500 block">Alcance</label>
                           <select value={formData.alcance} onChange={e => handleChange('alcance', e.target.value)} className="w-full bg-black/30 border border-white/20 rounded p-1 text-white text-xs">
                              <option>Curto</option>
                              <option>Médio</option>
                              <option>Longo</option>
                              <option>Extremo</option>
                           </select>
                        </div>
                     </div>
                  </div>
               )}

               {/* CAMPOS ESPECÍFICOS DE PROTEÇÃO */}
               {formData.tipo === 'protecao' && (
                  <div>
                     <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Bônus de Defesa</label>
                     <input
                        type="number"
                        value={formData.defesaBonus || 0}
                        onChange={e => handleChange('defesaBonus', Number(e.target.value))}
                        className="w-full bg-black border border-white/20 rounded p-2 text-white text-xs outline-none"
                     />
                  </div>
               )}

               {/* Descrição */}
               <div>
                  <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Descrição</label>
                  <textarea
                     value={formData.descricao}
                     onChange={e => handleChange('descricao', e.target.value)}
                     className="w-full h-20 bg-white/5 border border-white/20 rounded p-2 text-white text-xs outline-none resize-none"
                  />
               </div>

               {/* Melhorias e Maldição */}
               <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                     <input
                        type="checkbox"
                        id="checkAmaldicoado"
                        checked={formData.amaldicoado}
                        onChange={e => handleChange('amaldicoado', e.target.checked)}
                     />
                     <label htmlFor="checkAmaldicoado" className="text-sm text-gray-300">Item Amaldiçoado</label>
                  </div>

                  <div>
                     <div className="flex justify-between items-center mb-1">
                        <label className="block text-[10px] uppercase font-bold text-gray-500">Melhorias</label>
                        <button onClick={handleAddMelhoria} className="text-[10px] bg-white/10 px-2 rounded text-white">+ Add</button>
                     </div>
                     <div className="flex flex-wrap gap-2">
                        {(formData.melhorias || []).map((m, i) => (
                           <div key={i} className="bg-gray-900/50 border border-gray-500/30 px-2 py-1 rounded flex items-center gap-2 text-xs text-gray-200">
                              {m}
                              <button onClick={() => {
                                 const newM = formData.melhorias.filter((_, idx) => idx !== i)
                                 handleChange('melhorias', newM)
                              }} className="hover:text-white">×</button>
                           </div>
                        ))}
                     </div>
                  </div>
               </div>

            </div>

            {/* Footer */}
            <div className="p-4 border-t border-white/10 flex justify-end gap-2 bg-white/5">
               <button onClick={onClose} className="px-4 py-2 text-gray-400 hover:text-white text-xs font-bold uppercase">Cancelar</button>
               <button onClick={() => onSave(formData)} className="bg-white hover:bg-gray-200 text-black px-6 py-2 rounded text-xs font-bold uppercase">Salvar</button>
            </div>
         </div>
      </div>
   )
}
const RitualCard = ({ ritual, index, allRituals, onUpdate, onEdit }) => {
   const [isOpen, setIsOpen] = useState(false)

   const handleDelete = () => {
      if (!window.confirm(`Esquecer o ritual "${ritual.nome}"?`)) return
      const newList = allRituals.filter((_, i) => i !== index)
      onUpdate(newList)
   }

   // Encontra o ícone do elemento
   const ElementIcon = ELEMENTOS.find(e => e.id === ritual.elemento)?.icon || <GiBookCover />

   return (
      <div className={`group relative border transition-all rounded overflow-hidden ${isOpen ? 'bg-white/10 border-white/30' : 'bg-white/5 border-white/10 hover:border-white/20'}`}>

         {/* Cabeçalho Resumido */}
         <div className="flex items-center gap-3 p-3 cursor-pointer select-none" onClick={() => setIsOpen(!isOpen)}>

            {/* Ícone Elemento */}
            <div className="text-xl opacity-80" title={ritual.elemento}>
               {ElementIcon}
            </div>

            <div className="flex-1 min-w-0 flex flex-col">
               <div className="flex items-center justify-between mr-2">
                  <h4 className="font-bold text-sm text-white truncate">{ritual.nome}</h4>
                  <div className="flex items-center gap-2">
                     <span className="text-[10px] font-bold uppercase bg-black/40 px-1.5 py-0.5 rounded text-gray-300 border border-white/10">
                        {ritual.circulo}º Círculo
                     </span>
                     <span className="text-[10px] font-bold uppercase text-gray-300">
                        {ritual.custo} PE
                     </span>
                  </div>
               </div>
               <div className="flex gap-3 text-[10px] text-gray-500 uppercase mt-0.5">
                  <span>{ritual.execucao}</span>
                  <span>•</span>
                  <span>{ritual.alcance}</span>
                  <span>•</span>
                  <span>{ritual.alvo}</span>
               </div>
            </div>

            {/* Ações */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
               <button onClick={onEdit} className="text-gray-500 hover:text-white p-1.5"><FaEdit size={12} /></button>
               <button onClick={handleDelete} className="text-gray-600 hover:text-red-400 p-1.5"><FaTrash size={12} /></button>
            </div>
         </div>

         {/* Detalhes Expandidos */}
         {isOpen && (
            <div className="px-4 pb-4 pt-0 text-xs text-gray-300 border-t border-white/5 mt-1 animate-fade-in">

               {/* Grid de Informações Técnicas */}
               <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 my-3 text-[10px] uppercase font-bold text-gray-500">
                  <div className="bg-black/30 p-1 rounded border border-white/5 text-center">
                     <span className="block text-[8px] opacity-70">Execução</span>
                     <span className="text-gray-300">{ritual.execucao}</span>
                  </div>
                  <div className="bg-black/30 p-1 rounded border border-white/5 text-center">
                     <span className="block text-[8px] opacity-70">Alcance</span>
                     <span className="text-gray-300">{ritual.alcance}</span>
                  </div>
                  <div className="bg-black/30 p-1 rounded border border-white/5 text-center">
                     <span className="block text-[8px] opacity-70">Alvo/Área</span>
                     <span className="text-gray-300">{ritual.alvo}</span>
                  </div>
                  <div className="bg-black/30 p-1 rounded border border-white/5 text-center">
                     <span className="block text-[8px] opacity-70">Duração</span>
                     <span className="text-gray-300">{ritual.duracao}</span>
                  </div>
                  <div className="col-span-2 sm:col-span-4 bg-black/30 p-1 rounded border border-white/5 text-center">
                     <span className="block text-[8px] opacity-70">Resistência</span>
                     <span className="text-gray-300">{ritual.resistencia}</span>
                  </div>
               </div>

               {/* Descrições */}
               <div className="space-y-4">
                  {/* Normal */}
                  <div>
                     <span className="text-[10px] font-bold text-white uppercase bg-white/10 px-1 rounded">Normal</span>
                     <div className="mt-1 pl-2 border-l-2 border-white/10">
                        <RichTextDisplay text={ritual.descricao} />
                     </div>
                  </div>

                  {/* Discente */}
                  {ritual.temDiscente && (
                     <div>
                        <span className="text-[10px] font-bold text-indigo-300 uppercase bg-indigo-900/20 px-1 rounded border border-indigo-500/30">
                           Discente (+{ritual.custoDiscente || '?'} PE)
                        </span>
                        <div className="mt-1 pl-2 border-l-2 border-indigo-500/30">
                           <RichTextDisplay text={ritual.descDiscente} />
                        </div>
                     </div>
                  )}

                  {/* Verdadeiro */}
                  {ritual.temVerdadeiro && (
                     <div>
                        <span className="text-[10px] font-bold text-yellow-300 uppercase bg-yellow-900/20 px-1 rounded border border-yellow-500/30">
                           Verdadeiro (+{ritual.custoVerdadeiro || '?'} PE)
                        </span>
                        <div className="mt-1 pl-2 border-l-2 border-yellow-500/30">
                           <RichTextDisplay text={ritual.descVerdadeiro} />
                        </div>
                     </div>
                  )}
               </div>

            </div>
         )}
      </div>
   )
}
const RitualEditorModal = ({ ritual, onClose, onSave }) => {
   const [formData, setFormData] = useState(ritual || {
      nome: '', elemento: 'conhecimento', circulo: 1, custo: 1,
      execucao: 'Padrão', alcance: 'Curto', alvo: '1 ser', duracao: 'Instantânea', resistencia: '',
      descricao: '',
      temDiscente: false, custoDiscente: 0, descDiscente: '',
      temVerdadeiro: false, custoVerdadeiro: 0, descVerdadeiro: ''
   })

   const handleChange = (field, value) => setFormData(prev => ({ ...prev, [field]: value }))

   return (
      <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
         <div className="bg-[#121214] border border-white/20 w-full max-w-2xl rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

            <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
               <h2 className="text-xl font-bold text-white uppercase tracking-wider">{ritual ? 'Editar Ritual' : 'Novo Ritual'}</h2>
               <button onClick={onClose}><FaTimes className="text-gray-400 hover:text-white" /></button>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar space-y-4">
               {/* Nome e Elemento */}
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                     <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Nome</label>
                     <input value={formData.nome} onChange={e => handleChange('nome', e.target.value)} className="w-full bg-white/5 border border-white/20 rounded p-2 text-white text-sm outline-none focus:border-white" placeholder="Ex: Decadência" />
                  </div>
                  <div>
                     <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Elemento</label>
                     <select value={formData.elemento} onChange={e => handleChange('elemento', e.target.value)} className="w-full bg-black/30 border border-white/20 rounded p-2 text-white text-sm outline-none uppercase">
                        {ELEMENTOS.map(e => <option key={e.id} value={e.id}>{e.label}</option>)}
                     </select>
                  </div>
               </div>

               {/* Stats Numéricos */}
               <div className="grid grid-cols-3 gap-4">
                  <div>
                     <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Círculo</label>
                     <select value={formData.circulo} onChange={e => handleChange('circulo', Number(e.target.value))} className="w-full bg-black/30 border border-white/20 rounded p-2 text-white text-sm outline-none">
                        {CIRCULOS.map(c => <option key={c} value={c}>{c}º</option>)}
                     </select>
                  </div>
                  <div>
                     <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Custo (PE)</label>
                     <input type="number" value={formData.custo} onChange={e => handleChange('custo', Number(e.target.value))} className="w-full bg-white/5 border border-white/20 rounded p-2 text-white text-sm outline-none" />
                  </div>
                  <div>
                     <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Execução</label>
                     <input value={formData.execucao} onChange={e => handleChange('execucao', e.target.value)} className="w-full bg-white/5 border border-white/20 rounded p-2 text-white text-sm outline-none" placeholder="Padrão" />
                  </div>
               </div>

               {/* Detalhes Técnicos */}
               <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Alcance</label><input value={formData.alcance} onChange={e => handleChange('alcance', e.target.value)} className="w-full bg-white/5 border border-white/20 rounded p-2 text-white text-xs outline-none" /></div>
                  <div><label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Alvo/Área</label><input value={formData.alvo} onChange={e => handleChange('alvo', e.target.value)} className="w-full bg-white/5 border border-white/20 rounded p-2 text-white text-xs outline-none" /></div>
                  <div><label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Duração</label><input value={formData.duracao} onChange={e => handleChange('duracao', e.target.value)} className="w-full bg-white/5 border border-white/20 rounded p-2 text-white text-xs outline-none" /></div>
                  <div><label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Resistência</label><input value={formData.resistencia} onChange={e => handleChange('resistencia', e.target.value)} className="w-full bg-white/5 border border-white/20 rounded p-2 text-white text-xs outline-none" /></div>
               </div>

               {/* Descrições */}
               <div className="space-y-4 border-t border-white/10 pt-4">
                  <div>
                     <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Efeito Normal</label>
                     <textarea value={formData.descricao} onChange={e => handleChange('descricao', e.target.value)} className="w-full h-20 bg-white/5 border border-white/20 rounded p-2 text-white text-xs outline-none resize-none" />
                  </div>

                  <div className="flex flex-col gap-2 bg-indigo-900/10 p-2 rounded border border-indigo-500/20">
                     <div className="flex gap-4 items-center">
                        <label className="flex items-center gap-2 text-xs font-bold text-indigo-300 cursor-pointer">
                           <input type="checkbox" checked={formData.temDiscente} onChange={e => handleChange('temDiscente', e.target.checked)} />
                           Discente
                        </label>
                        {formData.temDiscente && <input type="number" placeholder="+PE" value={formData.custoDiscente} onChange={e => handleChange('custoDiscente', Number(e.target.value))} className="w-16 bg-black/50 border border-white/10 rounded px-2 py-0.5 text-xs text-white" />}
                     </div>
                     {formData.temDiscente && <textarea value={formData.descDiscente} onChange={e => handleChange('descDiscente', e.target.value)} className="w-full h-16 bg-black/30 border border-white/10 rounded p-2 text-white text-xs outline-none resize-none" placeholder="Efeito discente..." />}
                  </div>

                  <div className="flex flex-col gap-2 bg-yellow-900/10 p-2 rounded border border-yellow-500/20">
                     <div className="flex gap-4 items-center">
                        <label className="flex items-center gap-2 text-xs font-bold text-yellow-300 cursor-pointer">
                           <input type="checkbox" checked={formData.temVerdadeiro} onChange={e => handleChange('temVerdadeiro', e.target.checked)} />
                           Verdadeiro
                        </label>
                        {formData.temVerdadeiro && <input type="number" placeholder="+PE" value={formData.custoVerdadeiro} onChange={e => handleChange('custoVerdadeiro', Number(e.target.value))} className="w-16 bg-black/50 border border-white/10 rounded px-2 py-0.5 text-xs text-white" />}
                     </div>
                     {formData.temVerdadeiro && <textarea value={formData.descVerdadeiro} onChange={e => handleChange('descVerdadeiro', e.target.value)} className="w-full h-16 bg-black/30 border border-white/10 rounded p-2 text-white text-xs outline-none resize-none" placeholder="Efeito verdadeiro..." />}
                  </div>
               </div>
            </div>

            <div className="p-4 border-t border-white/10 flex justify-end gap-2 bg-white/5">
               <button onClick={onClose} className="px-4 py-2 text-gray-400 hover:text-white text-xs font-bold uppercase">Cancelar</button>
               <button onClick={() => onSave(formData)} className="bg-white hover:bg-gray-200 text-black px-6 py-2 rounded text-xs font-bold uppercase">Salvar</button>
            </div>
         </div>
      </div>
   )
}


const PERICIAS_PADRAO = {
   "Acrobacia": "agilidade",
   "Adestramento": "presenca",
   "Artes": "presenca",
   "Atletismo": "forca",
   "Atualidades": "intelecto",
   "Ciências": "intelecto",
   "Crime": "agilidade",
   "Diplomacia": "presenca",
   "Enganação": "presenca",
   "Fortitude": "vigor",
   "Furtividade": "agilidade",
   "Iniciativa": "agilidade",
   "Intimidação": "presenca",
   "Intuição": "presenca",
   "Investigação": "intelecto",
   "Luta": "forca",
   "Medicina": "intelecto",
   "Ocultismo": "intelecto",
   "Percepção": "presenca",
   "Pilotagem": "agilidade",
   "Pontaria": "agilidade",
   "Profissão": "intelecto",
   "Reflexos": "agilidade",
   "Religião": "presenca",
   "Sobrevivência": "intelecto",
   "Tática": "intelecto",
   "Tecnologia": "intelecto",
   "Vontade": "presenca"
}
const GRAUS_TREINAMENTO = {
   "destreinado": 0,
   "treinado": 4,
   "veterano": 7,
   "expert": 10
}
const ATRIBUTOS_SIGLAS = ["agilidade", "forca", "intelecto", "presenca", "vigor"]
const CATEGORIAS_HABILIDADES = ['Origem', 'Classe', 'Trilha', 'Poderes', 'Dedicação']
const ITEM_TYPES = [
   { id: 'arma', label: 'Arma', icon: <GiPistolGun /> },
   { id: 'municao', label: 'Munição', icon: <GiBullets /> },
   { id: 'protecao', label: 'Proteção', icon: <GiArmorVest /> },
   { id: 'geral', label: 'Geral', icon: <GiBackpack /> }
]
const PATENTES = ['Recruta', 'Operador', 'Agente Especial', 'Oficial de Operações', 'Agente de Elite']
const ELEMENTOS = [
   { id: 'conhecimento', label: 'Conhecimento', icon: <GiBookCover className="text-yellow-600" /> },
   { id: 'energia', label: 'Energia', icon: <GiHeavyLightning className="text-purple-500" /> },
   { id: 'morte', label: 'Morte', icon: <GiSpiralBottle className="text-gray-400" /> },
   { id: 'sangue', label: 'Sangue', icon: <GiDrop className="text-red-700" /> },
   { id: 'medo', label: 'Medo', icon: <GiGhost className="text-white" /> },
]
const CIRCULOS = [1, 2, 3, 4]


import AtributosImage from '../../assets/images/sheets/OrdemParanormal/atributos.png'


const OrdemParanormalSheet = ({ data, onUpdate, campaignPlayers = [], onDelete, onRoll }) => {
   const [character, setCharacter] = useState(data)
   const [tab, setTab] = useState('principal')
   const { user } = useContext(AuthContext)
   const currentUserId = user?.id?.toString()
   const ownerId = character.owner?._id?.toString()
   const isAdmin = user?.role === 'admin'
   const isOwner = (currentUserId && ownerId && currentUserId === ownerId) || isAdmin

   const [abilityFilter, setAbilityFilter] = useState('Todas')
   const [invFilter, setInvFilter] = useState('todos')
   const [isItemModalOpen, setIsItemModalOpen] = useState(false)
   const [editingItem, setEditingItem] = useState(null)
   const [isRitualModalOpen, setIsRitualModalOpen] = useState(false)
   const [editingRitual, setEditingRitual] = useState(null)
   const [dtAtributo, setDtAtributo] = useState('presenca')
   const [selectedPlayerId, setSelectedPlayerId] = useState('')
   const [shareableUsers, setShareableUsers] = useState([])

   const [debugJson, setDebugJson] = useState('')
   const [jsonError, setJsonError] = useState(null)

   const sheet = character.sheet

   if (!sheet.defesa) sheet.defesa = { equipamento: 0, outros: 0, bloqueio: 0, esquiva: 0 }
   if (!sheet.deslocamento) sheet.deslocamento = '9m'
   if (!sheet.inventario) sheet.inventario = []
   if (!sheet.limites) sheet.limites = { i: 2, ii: 0, iii: 0, iv: 0, credito: 'Baixo', patente: 'Recruta', prestigio: 0 }


   const totalDefesa = 10 + Number(sheet.atributos.agilidade) + Number(sheet.defesa.equipamento) + Number(sheet.defesa.outros)

   const availablePlayers = campaignPlayers.filter(p =>
      p._id !== character.owner?._id &&
      !character.sharedWith.some(shared => shared._id === p._id)
   )

   useEffect(() => {
      setCharacter(data)
   }, [data])
   useEffect(() => {
      if (tab === 'config') {
         api.get(`/characters/${character._id}/shareable-users`)
            .then(res => setShareableUsers(res.data))
            .catch(error => console.error("Erro ao buscar jogadores:", error))
      }
   }, [tab, character._id])
   useEffect(() => {
      setDebugJson(JSON.stringify(character, null, 2))
   }, [character])

   const handleUpdate = async (fieldPath, newValue) => {
      try {
         const updatedChar = JSON.parse(JSON.stringify(character))
         const keys = fieldPath.split('.')
         let current = updatedChar

         for (let i = 0; i < keys.length - 1; i++) {
            if (!current[keys[i]]) current[keys[i]] = {}
            current = current[keys[i]]
         }

         current[keys[keys.length - 1]] = newValue
         setCharacter(updatedChar)

         const { data: savedChar } = await api.put(`/characters/${character._id}`, { [fieldPath]: newValue })

         if (onUpdate) {
            onUpdate(savedChar)
         }
      }
      catch (error) {
         console.error("Erro ao salvar:", error)
      }
   }
   const handleTokenImageUpload = async (e) => {
      const file = e.target.files[0]
      if (!file) return

      const formData = new FormData()
      formData.append('file', file)

      try {
         const res = await api.post('/upload/tokens', formData)

         const newImageUrl = res.data.url
         handleUpdate('imageUrl', newImageUrl)
      } catch (error) {
         console.error("Erro ao enviar imagem:", error)
         alert("Erro ao salvar imagem.")
      }
      finally {
         e.target.value = ''
      }
   }


   const handleSaveRawJson = async () => {
      try {
         const parsedData = JSON.parse(debugJson)

         delete parsedData._id
         delete parsedData.createdAt
         delete parsedData.updatedAt
         delete parsedData.__v
         delete parsedData.owner
         delete parsedData.campaign

         const { data: savedChar } = await api.put(`/characters/${character._id}`, parsedData)

         setCharacter(savedChar)
         setJsonError(null)
         if (onUpdate) onUpdate(savedChar)

         alert("Ficha atualizada via JSON!")
      } catch (error) {
         setJsonError("JSON Inválido: " + error.message)
      }
   }

   return (
      <div className="h-full flex flex-col bg-[#121214] text-gray-200 font-sans selection:bg-gray-500/30">

         {/* --- CABEÇALHO --- */}
         <div className="bg-white/5 p-4 border-b border-gray-800 shadow-md">
            <div className="flex gap-4 items-center">
               <div className="relative shrink-0">
                  <div className="w-16 h-16 rounded overflow-hidden border-2 border-gray-600 bg-black">
                     {character.imageUrl ? (
                        <img src={character.imageUrl} className="w-full h-full object-cover" alt="Avatar" />
                     ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-700 bg-gray-900">?</div>
                     )}
                  </div>
               </div>

               <div className="flex-1 min-w-0">
                  {/* Linha do Nome e Níveis */}
                  <div className='flex mb-2'>
                     <span className="bg-black/20 text-xl font-bold uppercase tracking-wider truncate leading-tight flex items-center">
                        <EditableInput
                           value={character.name}
                           className="bg-transparent font-bold px-2"
                           onSave={(val) => handleUpdate('name', val)}
                        />
                     </span>

                     <div className='text-gray-400 flex items-center gap-2 px-2 py-1'>
                        <div className="flex gap-1.5">
                           <span>Nível</span>
                           <div className='bg-black/20 w-9 px-2'>
                              <EditableInput
                                 value={sheet.nivel}
                                 type="number"
                                 className="text-center font-bold bg-transparent"
                                 onSave={(val) => handleUpdate('sheet.nivel', Number(val))}
                              />
                           </div>
                        </div>
                        <span className="text-gray-600">/</span>
                        <div className="flex gap-1">
                           <span>NEX</span>
                           <div className='bg-black/20 w-9 px-2'>
                              <EditableInput
                                 value={sheet.nex}
                                 type="number"
                                 className="text-center font-bold bg-transparent"
                                 onSave={(val) => handleUpdate('sheet.nex', Number(val))}
                              />
                           </div>
                           <span className="font-bold">%</span>
                        </div>
                     </div>
                  </div>

                  {/* Linha de Detalhes (Origem, Classe, Trilha) */}
                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-400 font-medium uppercase tracking-wide items-center">
                     <div className="min-w-10">
                        <EditableInput
                           value={sheet.origem}
                           placeholder='Origem'
                           className="w-20!"
                           onSave={(val) => handleUpdate('sheet.origem', val)}
                        />
                     </div>

                     <span className="text-gray-600 font-bold">•</span>

                     <div className="min-w-10">
                        <EditableInput
                           value={sheet.classe}
                           placeholder='Classe'
                           className="w-20!"
                           onSave={(val) => handleUpdate('sheet.classe', val)}
                        />
                     </div>

                     <span className="text-gray-600 font-bold">•</span>

                     <div className="min-w-10">
                        <EditableInput
                           value={sheet.trilha}
                           placeholder='Trilha'
                           className="w-20!"
                           onSave={(val) => handleUpdate('sheet.trilha', val)}
                        />
                     </div>
                  </div>
               </div>
            </div>
         </div>

         {/* --- NAVEGAÇÃO DE ABAS --- */}
         <nav className="flex px-2 bg-white/5 border-b border-gray-800 gap-1 pt-2 overflow-x-auto no-scrollbar">
            {['principal', 'pericias', 'habilidades', 'inventario', 'rituais', 'detalhes', 'config', 'debug']
               .filter(t => {
                  if (t === 'config') return isOwner
                  if (t === 'debug') return isAdmin
                  return true
               })
               .map(t => (
                  <button
                     key={t}
                     onClick={() => setTab(t)}
                     className={`text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-t border-t border-x border-transparent transition-all
                    ${tab === t
                           ? 'bg-[#121214] text-white border-gray-800 border-b-[#121214] translate-y-px'
                           : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800'}`}
                  >
                     {t === 'debug' ? <FaBug /> : t === 'config' ? <FaCog /> : t}
                  </button>
               ))}
         </nav>

         {/* --- CONTEÚDO (Scrollável) --- */}
         <div className="min-h-0 flex-1 overflow-y-auto p-4 custom-scrollbar bg-[#121214]">

            {/* ================= PRINCIPAL ================= */}
            {tab === 'principal' && (
               <div className="flex flex-col md:flex-row items-center md:gap-5 animate-fade-in">

                  {/* ATRIBUTOS */}
                  <div className="hidden md:block relative w-full max-w-[350px] mx-auto aspect-square select-none">
                     <img
                        src={AtributosImage}
                        alt="Pentagrama de Atributos"
                        className="w-full h-full object-contain opacity-90"
                     />
                     <AttrValue
                        value={sheet.atributos.agilidade}
                        top="16%" left="50%"
                        onSave={(val) => handleUpdate('sheet.atributos.agilidade', Number(val))}
                        label="Agilidade"
                        onRoll={onRoll}
                     />
                     <AttrValue
                        value={sheet.atributos.forca}
                        top="38%" left="18%"
                        onSave={(val) => handleUpdate('sheet.atributos.forca', Number(val))}
                        label="Força"
                        onRoll={onRoll}
                     />
                     <AttrValue
                        value={sheet.atributos.intelecto}
                        top="38%" left="82%"
                        onSave={(val) => handleUpdate('sheet.atributos.intelecto', Number(val))}
                        label="Intelecto"
                        onRoll={onRoll}
                     />
                     <AttrValue
                        value={sheet.atributos.presenca}
                        top="76%" left="28%"
                        onSave={(val) => handleUpdate('sheet.atributos.presenca', Number(val))}
                        label="Presença"
                        onRoll={onRoll}
                     />
                     <AttrValue
                        value={sheet.atributos.vigor}
                        top="76%" left="70%"
                        onSave={(val) => handleUpdate('sheet.atributos.vigor', Number(val))}
                        label="Vigor"
                        onRoll={onRoll}
                     />
                  </div>
                  <div className="md:hidden flex justify-between gap-2 overflow-x-auto pb-2 px-1">
                     {['agilidade', 'forca', 'intelecto', 'presenca', 'vigor'].map(attr => (
                        <div key={attr} className="flex flex-col items-center bg-white/5 p-2 rounded border border-white/10 min-w-[60px]">
                           <span className="text-[10px] uppercase font-bold text-gray-500 mb-1">{attr.substring(0, 3)}</span>
                           <EditableInput
                              value={sheet.atributos[attr]}
                              type="number"
                              onSave={v => handleUpdate(`sheet.atributos.${attr}`, Number(v))}
                              className="text-2xl font-black text-white text-center w-full bg-transparent"
                           />
                        </div>
                     ))}
                  </div>

                  <div className='w-full space-y-4'>
                     {/* BARRAS DE STATUS */}
                     <div className="grid gap-4 mt-10">

                        {/* Vida (PV) */}
                        <div className="relative">
                           <span className="text-xs font-bold text-red-500 flex items-center gap-1 uppercase tracking-wide">
                              <FaHeart /> Pontos de Vida
                           </span>

                           <div className="relative bg-gray-800 w-full h-8 flex justify-between py-1 border border-gray-500 rounded-sm overflow-hidden">
                              <button
                                 onClick={() => handleUpdate('sheet.pv.atual', (sheet.pv?.atual || 0) - 1)}
                                 className='text-gray-200 p-0.5 ml-1 rounded transition-all hover:bg-black/20 hover:text-white z-10'
                              >
                                 <MdKeyboardArrowLeft size={20} />
                              </button>
                              <span className="relative flex items-center justify-center font-mono gap-1 text-white font-semibold z-10">
                                 <EditableInput
                                    value={sheet.pv?.atual}
                                    type="number"
                                    className="w-10 text-right"
                                    onSave={(val) => handleUpdate('sheet.pv.atual', Number(val))}
                                 />/
                                 <EditableInput
                                    value={sheet.pv?.max}
                                    type="number"
                                    className="w-10"
                                    onSave={(val) => handleUpdate('sheet.pv.max', Number(val))}
                                 />
                              </span>
                              <button
                                 onClick={() => handleUpdate('sheet.pv.atual', (sheet.pv?.atual || 0) + 1)}
                                 className='text-gray-200 p-0.5 mr-1 rounded transition-all hover:bg-black/20 hover:text-white z-10'
                              >
                                 <MdKeyboardArrowRight size={20} />
                              </button>

                              <div className="absolute top-0 bg-red-700 h-full transition-all duration-500 z-1"
                                 style={{ width: `${Math.min(((sheet.pv?.atual || 0) / (sheet.pv?.max || 1)) * 100, 100)}%` }}
                              ></div>
                              <div className="absolute -right-2 -bottom-5 text-red-900/60 z-2"><FaHeart size={50} /></div>
                           </div>
                        </div>

                        {/* Sanidade (PV) */}
                        <div className="relative">
                           <span className="text-xs font-bold text-blue-500 flex items-center gap-1 uppercase tracking-wide">
                              <FaBrain /> Pontos de Sanidade
                           </span>

                           <div className="relative bg-gray-800 w-full h-8 flex justify-between py-1 border border-gray-500 rounded-sm overflow-hidden">
                              <button
                                 onClick={() => handleUpdate('sheet.san.atual', (sheet.san?.atual || 0) - 1)}
                                 className='text-gray-200 p-0.5 ml-1 rounded transition-all hover:bg-black/20 hover:text-white z-10'
                              >
                                 <MdKeyboardArrowLeft size={20} />
                              </button>
                              <span className="relative flex items-center justify-center font-mono gap-1 text-white font-semibold z-10">
                                 <EditableInput
                                    value={sheet.san?.atual}
                                    type="number"
                                    className="w-10 text-right"
                                    onSave={(val) => handleUpdate('sheet.san.atual', Number(val))}
                                 />/
                                 <EditableInput
                                    value={sheet.san?.max}
                                    type="number"
                                    className="w-10"
                                    onSave={(val) => handleUpdate('sheet.san.max', Number(val))}
                                 />
                              </span>
                              <button
                                 onClick={() => handleUpdate('sheet.san.atual', (sheet.san?.atual || 0) + 1)}
                                 className='text-gray-200 p-0.5 mr-1 rounded transition-all hover:bg-black/20 hover:text-white z-10'
                              >
                                 <MdKeyboardArrowRight size={20} />
                              </button>

                              <div className="absolute top-0 bg-blue-700 h-full transition-all duration-500 z-1"
                                 style={{ width: `${Math.min(((sheet.san?.atual || 0) / (sheet.san?.max || 1)) * 100, 100)}%` }}
                              ></div>
                              <div className="absolute -right-2 -bottom-5 text-blue-900/60 z-2"><FaBrain size={50} /></div>
                           </div>
                        </div>

                        {/* Esforço (PE) */}
                        <div className="relative">
                           <span className="text-xs font-bold text-yellow-500 flex items-center gap-1 uppercase tracking-wide">
                              <GiPsychicWaves /> Pontos de Esforço
                           </span>

                           <div className="relative bg-gray-800 w-full h-8 flex justify-between py-1 border border-gray-500 rounded-sm overflow-hidden">
                              <button
                                 onClick={() => handleUpdate('sheet.pe.atual', (sheet.pe?.atual || 0) - 1)}
                                 className='text-gray-200 p-0.5 ml-1 rounded transition-all hover:bg-black/20 hover:text-white z-10'
                              >
                                 <MdKeyboardArrowLeft size={20} />
                              </button>
                              <span className="relative flex items-center justify-center font-mono gap-1 text-white font-semibold z-10">
                                 <EditableInput
                                    value={sheet.pe?.atual}
                                    type="number"
                                    className="w-10 text-right"
                                    onSave={(val) => handleUpdate('sheet.pe.atual', Number(val))}
                                 />/
                                 <EditableInput
                                    value={sheet.pe?.max}
                                    type="number"
                                    className="w-10"
                                    onSave={(val) => handleUpdate('sheet.pe.max', Number(val))}
                                 />
                              </span>
                              <button
                                 onClick={() => handleUpdate('sheet.pe.atual', (sheet.pe?.atual || 0) + 1)}
                                 className='text-gray-200 p-0.5 mr-1 rounded transition-all hover:bg-black/20 hover:text-white z-10'
                              >
                                 <MdKeyboardArrowRight size={20} />
                              </button>

                              <div className="absolute top-0 bg-yellow-600 h-full transition-all duration-500 z-1"
                                 style={{ width: `${Math.min(((sheet.pe?.atual || 0) / (sheet.pe?.max || 1)) * 100, 100)}%` }}
                              ></div>
                              <div className="absolute -right-2 -bottom-5 text-yellow-900/60 z-2"><GiPsychicWaves size={50} /></div>
                           </div>
                        </div>
                     </div>

                     {/* DEFESA E MOVIMENTO */}
                     <div className="flex flex-col gap-2 mt-4">
                        <div className='bg-white/5 flex flex-col items-center gap-4 p-4 border border-gray-800 rounded'>
                           <div className='flex w-full'>
                              <div className='relative flex items-center justify-center w-20 h-20 shrink-0'>
                                 <LuShield className='w-full h-full stroke-[1.5]' />
                                 <div className='absolute inset-0 flex items-center justify-center'>
                                    <span className='text-3xl font-bold tracking-tighter'>{totalDefesa}</span>
                                 </div>
                              </div>

                              {/* FÓRMULA DEFESA */}
                              <div className='flex-1 flex flex-col justify-center px-2'>
                                 <span className='text-lg text-gray-200 font-bold uppercase tracking-wide leading-none mb-1'>Defesa</span>

                                 <div className='text-sm text-gray-400 font-mono flex items-center flex-wrap gap-2'>
                                    <span className="text-gray-600">=</span>
                                    <span title="Base">10</span>
                                    <span className="text-gray-600">+</span>
                                    <span title="Agilidade" className="text-white">AGI</span>
                                    <span className="text-gray-600">+</span>

                                    {/* Equipamento */}
                                    <div className='w-12 flex flex-col items-center  mt-5 group'>
                                       <div className='border-b border-gray-500 transition-all group-hover:border-gray-400'>
                                          <EditableInput
                                             value={sheet.defesa.equipamento}
                                             type="number"
                                             className="text-center text-white font-bold bg-transparent"
                                             onSave={(val) => handleUpdate('sheet.defesa.equipamento', Number(val))}
                                          />
                                       </div>
                                       <span className='text-xs text-gray-500 uppercase mt-0.5'>Equip.</span>
                                    </div>

                                    <span>+</span>

                                    {/* Outros */}
                                    <div className='w-12 flex flex-col items-center  mt-5 group'>
                                       <div className='border-b border-gray-500 transition-all group-hover:border-gray-400'>
                                          <EditableInput
                                             value={sheet.defesa.outros}
                                             type="number"
                                             className="text-center text-white font-bold bg-transparent"
                                             onSave={(val) => handleUpdate('sheet.defesa.outros', Number(val))}
                                          />
                                       </div>
                                       <span className='text-xs text-gray-500 uppercase mt-0.5'>Outros</span>
                                    </div>
                                 </div>
                              </div>
                           </div>

                           {/* REAÇÕES (Bloqueio e Esquiva) */}
                           <div className='w-full flex gap-6 pr-4 pl-4'>
                              {/* Bloqueio */}
                              <div className='flex flex-col items-center group'>
                                 <span className='text-gray-400 font-bold uppercase text-xs mb-1 tracking-wider transition-all group-hover:text-gray-300'>Bloqueio</span>
                                 <div className='w-12 pb-1 border-b-2 border-gray-600 transition-all group-hover:border-white'>
                                    <EditableInput
                                       value={sheet.defesa.bloqueio}
                                       type="number"
                                       className="text-center text-2xl font-bold text-white bg-transparent"
                                       onSave={(val) => handleUpdate('sheet.defesa.bloqueio', Number(val))}
                                    />
                                 </div>
                              </div>

                              <div className='flex flex-col items-center group'>
                                 <span className='text-gray-400 font-bold uppercase text-xs mb-1 tracking-wider transition-all group-hover:text-gray-300'>Esquiva</span>
                                 <div className='w-12 pb-1 border-b-2 border-gray-600 transition-all group-hover:border-white'>
                                    <EditableInput
                                       value={sheet.defesa.esquiva}
                                       type="number"
                                       className="text-center text-2xl font-bold text-white bg-transparent"
                                       onSave={(val) => handleUpdate('sheet.defesa.esquiva', Number(val))}
                                    />
                                 </div>
                              </div>
                           </div>
                        </div>

                        {/* Deslocamento */}
                        <div className="bg-white/5 p-2 rounded border border-gray-800 flex items-center justify-between px-4">
                           <div className="flex items-center gap-2 text-gray-400 text-xs font-bold uppercase">
                              <FaRunning size={16} /> Deslocamento
                           </div>
                           <div className="w-20 text-right">
                              <EditableInput
                                 value={sheet.deslocamento}
                                 className="text-white font-bold text-right bg-transparent"
                                 onSave={(val) => handleUpdate('sheet.deslocamento', val)}
                              />
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
            )}

            {/* ================= PERÍCIAS ================= */}
            {tab === 'pericias' && (
               <div className="space-y-6 animate-fade-in pb-4">
                  <div className="bg-[#1c1c1e] p-3 rounded border border-gray-800 flex gap-2 items-center">
                     <input
                        type="text"
                        placeholder="Nome da Nova Perícia"
                        className="bg-black/30 text-xs text-white p-2 rounded border border-gray-700 flex-1 outline-none focus:border-gray-500"
                        id="newSkillInput"
                        onKeyDown={(e) => {
                           if (e.key === 'Enter') {
                              const nome = e.target.value.trim()
                              if (nome) {
                                 // Cria a perícia como Destreinada e usando Intelecto por padrão
                                 handleUpdate(`sheet.pericias.${nome}`, {
                                    grau: 'destreinado',
                                    atributo: 'intelecto',
                                    outros: 0
                                 })
                                 e.target.value = ''
                              }
                           }
                        }}
                     />
                     <button
                        onClick={() => {
                           const input = document.getElementById('newSkillInput')
                           const nome = input.value.trim()
                           if (nome) {
                              handleUpdate(`sheet.pericias.${nome}`, {
                                 grau: 'destreinado',
                                 atributo: 'intelecto',
                                 outros: 0
                              })
                              input.value = ''
                           }
                        }}
                        className="bg-gray-700 hover:bg-gray-600 p-2 rounded transition-colors"
                        title="Adicionar Perícia"
                     >
                        <FaPlus size={12} />
                     </button>
                  </div>

                  {/* Função Interna para Renderizar os Grupos */}
                  {['expert', 'veterano', 'treinado', 'destreinado'].map((grau) => {
                     const todasPericias = Array.from(new Set([
                        ...Object.keys(PERICIAS_PADRAO),
                        ...Object.keys(sheet.pericias || {})
                     ]))
                     const periciasDoGrau = todasPericias.filter((nome) => {
                        const salvo = sheet.pericias?.[nome] || {}
                        const grauSalvo = salvo.grau || 'destreinado'
                        return grauSalvo === grau
                     }).sort((a, b) => a.localeCompare(b))

                     if (periciasDoGrau.length === 0 && grau !== 'destreinado') return null

                     const bonusGrau = GRAUS_TREINAMENTO[grau]
                     const corTitulo =
                        grau === 'expert' ? 'text-yellow-500 border-yellow-500' :
                           grau === 'veterano' ? 'text-indigo-400 border-indigo-400' :
                              grau === 'treinado' ? 'text-white border-gray-500' :
                                 'text-gray-500 border-gray-800'

                     return (
                        <div key={grau} className="flex flex-col gap-2">
                           {/* Cabeçalho do Grupo */}
                           <div className={`flex items-center gap-2 border-b pb-1 ${corTitulo}`}>
                              <h3 className="uppercase font-bold text-sm tracking-wider">{grau} (+{bonusGrau})</h3>
                              <span className="text-[10px] opacity-60 ml-auto">{periciasDoGrau.length} perícias</span>
                           </div>

                           {/* Lista de Perícias */}
                           <div className="grid gap-1">
                              <div className="grid grid-cols-13 text-[9px] uppercase font-bold text-gray-600 px-2">
                                 <div className="col-span-1"></div>
                                 <div className="col-span-4">Perícia</div>
                                 <div className="col-span-2 text-center">Atributo</div>
                                 <div className="col-span-1 text-center">Treino</div>
                                 <div className="col-span-2 text-center">Outros</div>
                                 <div className="col-span-2 text-center">Total</div>
                                 <div className="col-span-2 text-center"></div>
                              </div>

                              {periciasDoGrau.map((nome) => {
                                 const isPadrao = PERICIAS_PADRAO.hasOwnProperty(nome)
                                 const attrPadrao = PERICIAS_PADRAO[nome] || 'intelecto'

                                 const salvo = sheet.pericias?.[nome] || {}
                                 const atributoUsado = salvo.atributo || attrPadrao
                                 const bonusOutros = salvo.outros || 0

                                 const totalBonus = bonusGrau + bonusOutros

                                 const handleDeleteSkill = async () => {
                                    if (!window.confirm(`Excluir a perícia "${nome}"?`)) return

                                    const novasPericias = { ...sheet.pericias }
                                    delete novasPericias[nome]

                                    handleUpdate('sheet.pericias', novasPericias)
                                 }

                                 return (
                                    <div key={nome} className="grid grid-cols-13 items-center bg-[#1c1c1e] hover:bg-gray-800 p-2 rounded border border-transparent hover:border-gray-700 transition-colors group">
                                       {/* BOTÃO ROLAR PERÍCIA */}
                                       <button
                                          onClick={() => {
                                             if (onRoll) {
                                                const attrVal = sheet.atributos[atributoUsado] || 0
                                                const dados = attrVal > 0 ? `${attrVal}d20kh1` : `2d20kl1`
                                                const formula = `${dados} + ${totalBonus}`
                                                onRoll(formula, `${character.name} (${nome})`)
                                             }
                                          }}
                                          className="col-span-1 flex justify-center opacity-0 group-hover:opacity-100 hover:scale-103 transition-all"
                                          title="Rolar Perícia"
                                       >
                                          <FaDiceD20 size={20}/>
                                       </button>

                                       {/* Nome e Seletor de Grau */}
                                       <div className="col-span-4 flex flex-col overflow-hidden">
                                          <span className="text-sm font-bold text-gray-200 leading-none">{nome}</span>
                                          {/* Dropdown para mudar o grau */}
                                          <select
                                             value={grau}
                                             onChange={(e) => handleUpdate(`sheet.pericias.${nome}.grau`, e.target.value)}
                                             className="w-25 bg-transparent text-[9px] uppercase text-gray-500 border-none p-0 focus:ring-0 
                                             cursor-pointer hover:text-gray-400"
                                          >
                                             <option value="destreinado">Destreinado</option>
                                             <option value="treinado">Treinado</option>
                                             <option value="veterano">Veterano</option>
                                             <option value="expert">Expert</option>
                                          </select>
                                       </div>

                                       {/* Atributo */}
                                       <div className="col-span-2 flex justify-center">
                                          <select
                                             value={atributoUsado}
                                             onChange={(e) => handleUpdate(`sheet.pericias.${nome}.atributo`, e.target.value)}
                                             className="bg-black/30 h-7 text-[10px] uppercase font-mono text-gray-400 rounded px-1 py-0.5 border border-gray-800 
                                             focus:border-gray-500 cursor-pointer outline-none"
                                          >
                                             {ATRIBUTOS_SIGLAS.map(sigla => (
                                                <option key={sigla} value={sigla}>{sigla.substring(0, 3)}</option>
                                             ))}
                                          </select>
                                       </div>

                                       {/* Bônus de Treino */}
                                       <div className="col-span-1 text-center text-xs font-mono text-gray-500">
                                          {bonusGrau > 0 ? `+${bonusGrau}` : '-'}
                                       </div>

                                       {/* Outros */}
                                       <div className="col-span-2 flex justify-center">
                                          <div className="w-8 border-b border-gray-600 group-hover:border-gray-400">
                                             <EditableInput
                                                value={bonusOutros}
                                                type="number"
                                                className="text-center text-xs text-white bg-transparent"
                                                onSave={(val) => handleUpdate(`sheet.pericias.${nome}.outros`, Number(val))}
                                             />
                                          </div>
                                       </div>

                                       {/* Total */}
                                       <div className="col-span-2 text-center">
                                          <span className={`text-sm font-bold font-mono ${totalBonus > 0 ? 'text-gray-400' : 'text-gray-600'}`}>
                                             {totalBonus >= 0 ? '+' : ''}{totalBonus}
                                          </span>
                                       </div>

                                       {/* Delete */}
                                       <div className="col-span-1 flex justify-end">
                                          {!isPadrao && (
                                             <button
                                                onClick={handleDeleteSkill}
                                                className="text-red-900 hover:text-red-500 p-1 transition-colors opacity-0 group-hover:opacity-100"
                                                title="Excluir Perícia"
                                             >
                                                <FaTrash size={10} />
                                             </button>
                                          )}
                                       </div>
                                    </div>
                                 )
                              })}
                           </div>
                        </div>
                     )
                  })}
               </div>
            )}

            {/* ================= HABILIDADES ================= */}
            {tab === 'habilidades' && (
               <div className="flex flex-col h-full animate-fade-in space-y-4 pb-4">

                  {/* --- CONTROLES (Filtro e Criar) --- */}
                  <div className="flex flex-col sm:flex-row gap-3 justify-between items-center bg-white/5 p-3 rounded border border-white/10">

                     {/* Filtros */}
                     <div className="flex gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 custom-scrollbar">
                        <button
                           onClick={() => setAbilityFilter('Todas')}
                           className={`px-3 py-1 rounded text-xs font-bold uppercase tracking-wide border transition-all whitespace-nowrap
                              ${abilityFilter === 'Todas' ? 'bg-gray-600 border-gray-500 text-white' : 'bg-black/20 border-white/10 text-gray-500 hover:text-gray-300'}`}
                        >
                           Todas
                        </button>
                        {CATEGORIAS_HABILIDADES.map(cat => (
                           <button
                              key={cat}
                              onClick={() => setAbilityFilter(cat)}
                              className={`px-3 py-1 rounded text-xs font-bold uppercase tracking-wide border transition-all whitespace-nowrap
                                 ${abilityFilter === cat ? 'bg-gray-600 border-gray-500 text-white' : 'bg-black/20 border-white/10 text-gray-500 hover:text-gray-300'}`}
                           >
                              {cat}
                           </button>
                        ))}
                     </div>

                     {/* Botão Adicionar */}
                     <button
                        onClick={() => {
                           // Adiciona uma nova habilidade ao final do array
                           const novasHabilidades = [...(sheet.habilidades || [])]
                           novasHabilidades.push({
                              id: Date.now().toString(), // ID único simples
                              nome: "Nova Habilidade",
                              descricao: "Descrição da habilidade. Use **negrito** ou *itálico*.",
                              categoria: "Origem"
                           })
                           handleUpdate('sheet.habilidades', novasHabilidades)
                        }}
                        className="flex items-center gap-2 bg-green-700/80 hover:bg-green-600 text-white px-4 py-1.5 rounded text-xs font-bold uppercase transition-colors shrink-0"
                     >
                        <FaPlus /> Nova
                     </button>
                  </div>

                  {/* --- LISTA DE HABILIDADES --- */}
                  <div className="flex-1 space-y-3">
                     {(sheet.habilidades || [])
                        .map((hab, index) => ({ ...hab, originalIndex: index })) // Preserva o index original para edição
                        .filter(hab => abilityFilter === 'Todas' || hab.categoria === abilityFilter)
                        .map((hab) => (
                           <AbilityCard
                              key={hab.id}
                              habilidade={hab}
                              index={hab.originalIndex}
                              allAbilities={sheet.habilidades || []}
                              onUpdate={(newArray) => handleUpdate('sheet.habilidades', newArray)}
                           />
                        ))
                     }

                     {(!sheet.habilidades || sheet.habilidades.length === 0) && (
                        <div className="text-center py-10 opacity-30 text-sm">
                           Nenhuma habilidade criada.
                        </div>
                     )}
                  </div>
               </div>
            )}

            {/* ================= INVENTÁRIO (Exemplo Rápido) ================= */}
            {tab === 'inventario' && (
               <div className="flex flex-col h-full animate-fade-in pb-4 space-y-4">

                  {/* --- HEADER: Patente, Carga e Limites --- */}
                  <div className="bg-white/5 border border-white/10 p-4 rounded grid gap-4">

                     {/* Linha 1: Prestígio, Patente e Carga */}
                     <div className="flex flex-wrap justify-between items-end gap-4 border-b border-white/10 pb-4">
                        <div className="flex gap-4">
                           <div className="flex flex-col">
                              <span className="text-[10px] uppercase font-bold text-gray-500">Patente</span>
                              <div className="w-40 border-b border-white/20">
                                 <select
                                    value={sheet.limites.patente}
                                    onChange={(e) => handleUpdate('sheet.limites.patente', e.target.value)}
                                    className="bg-transparent text-white font-bold uppercase text-sm w-full outline-none [&>option]:bg-black"
                                 >
                                    {PATENTES.map(p => <option key={p} value={p}>{p}</option>)}
                                 </select>
                              </div>
                           </div>
                           <div className="flex flex-col items-center">
                              <span className="text-[10px] uppercase font-bold text-gray-500">Prestígio</span>
                              <div className="w-12 border-b border-white/20">
                                 <EditableInput
                                    value={sheet.limites.prestigio}
                                    type="number"
                                    className="text-center font-mono text-white"
                                    onSave={v => handleUpdate('sheet.limites.prestigio', Number(v))}
                                 />
                              </div>
                           </div>
                        </div>

                        {/* CÁLCULO DE CARGA */}
                        {(() => {
                           const cargaAtual = (sheet.inventario || []).reduce((acc, i) => acc + (Number(i.espacos) || 0), 0)
                           // Regra básica: 5 por ponto de força + 5 base (ajuste conforme sua regra da mesa)
                           const cargaMax = sheet.cargaMax || (5 + (sheet.atributos.forca * 5))
                           const isSobrecarregado = cargaAtual > cargaMax

                           return (
                              <div className="flex flex-col items-end">
                                 <span className="text-[10px] uppercase font-bold text-gray-500 flex items-center gap-1">
                                    <FaWeightHanging /> Carga
                                 </span>
                                 <div className={`text-xl font-mono font-bold flex items-baseline gap-1 ${isSobrecarregado ? 'text-gray-100' : 'text-gray-400'}`}>
                                    <span className={isSobrecarregado ? 'text-white underline decoration-wavy decoration-white/50' : 'text-white'}>
                                       {cargaAtual}
                                    </span>
                                    <span className="text-xs">/</span>
                                    <div className="w-8">
                                       <EditableInput
                                          value={cargaMax}
                                          type="number"
                                          className="text-xs text-gray-500 text-left bg-transparent"
                                          onSave={v => handleUpdate('sheet.cargaMax', Number(v))}
                                       />
                                    </div>
                                 </div>
                                 {isSobrecarregado && <span className="text-[9px] uppercase font-bold text-white bg-white/20 px-1 rounded">Sobrecarregado</span>}
                              </div>
                           )
                        })()}
                     </div>

                     {/* Linha 2: Limites de Itens por Categoria e Crédito */}
                     <div className="flex flex-wrap gap-6 items-center">
                        <div className="flex items-center gap-2">
                           <span className="text-[10px] uppercase font-bold text-gray-500">Limite Itens:</span>
                           {['i', 'ii', 'iii', 'iv'].map(cat => {
                              const qtdAtual = sheet.inventario.filter(i => i.categoria === cat.toUpperCase() || i.categoria === cat.length).length
                              return (
                                 <div key={cat} className="flex flex-col items-center bg-black/20 px-2 py-1 rounded border border-white/5">
                                    <span className="text-[9px] font-bold text-gray-400 uppercase">{cat.toUpperCase()}</span>
                                    <div className="flex items-center gap-1 font-mono text-xs">
                                       <span className={qtdAtual > sheet.limites[cat] ? 'text-white' : 'text-gray-400'}>{qtdAtual}</span>
                                       <span className="text-gray-600">/</span>
                                       <div className="w-4">
                                          <EditableInput
                                             value={sheet.limites[cat]}
                                             type="number"
                                             className="text-center text-white"
                                             onSave={v => handleUpdate(`sheet.limites.${cat}`, Number(v))}
                                          />
                                       </div>
                                    </div>
                                 </div>
                              )
                           })}
                        </div>

                        <div className="flex items-center gap-2 ml-auto">
                           <span className="text-[10px] uppercase font-bold text-gray-500">Crédito:</span>
                           <div className="w-24 border-b border-white/20">
                              <select
                                 value={sheet.limites.credito}
                                 onChange={(e) => handleUpdate('sheet.limites.credito', e.target.value)}
                                 className="bg-transparent text-white font-bold uppercase text-xs w-full outline-none [&>option]:bg-black"
                              >
                                 <option>Baixo</option>
                                 <option>Médio</option>
                                 <option>Alto</option>
                                 <option>Ilimitado</option>
                              </select>
                           </div>
                        </div>
                     </div>
                  </div>

                  {/* --- ÁREA DE EQUIPADOS (Armas e Proteção Ativas) --- */}
                  <div className="space-y-2">
                     <h3 className="text-xs font-bold uppercase text-gray-500 flex items-center gap-2 px-1">
                        <LuSword /> Equipados
                     </h3>
                     <div className="grid grid-cols-1 md:grid-cols-2 items-start gap-3">
                        {sheet.inventario.filter(i => i.equipado).map((item, idx) => (
                           <InventoryItemCard
                              key={item.id || idx}
                              item={item}
                              allItems={sheet.inventario}
                              onUpdate={(newList) => handleUpdate('sheet.inventario', newList)}
                              onEdit={() => { setEditingItem(item); setIsItemModalOpen(true) }}
                           />
                        ))}
                        {sheet.inventario.filter(i => i.equipado).length === 0 && (
                           <div className="col-span-full border border-dashed border-white/10 rounded p-3 text-center text-xs text-gray-600">
                              Nenhum item equipado. Você pode equipar armas e armaduras clicando no check.
                           </div>
                        )}
                     </div>
                  </div>

                  {/* --- FILTROS E BOTÃO ADICIONAR --- */}
                  <div className="flex justify-between items-center border-b border-white/10 pb-2 mt-4">
                     <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-1">
                        <button
                           onClick={() => setInvFilter('todos')}
                           className={`px-3 py-1 rounded text-[10px] font-bold uppercase border transition-all ${invFilter === 'todos' ? 'bg-white text-black border-white' : 'bg-transparent text-gray-500 border-white/10 hover:border-white/30'}`}
                        >
                           Todos
                        </button>
                        {ITEM_TYPES.map(type => (
                           <button
                              key={type.id}
                              onClick={() => setInvFilter(type.id)}
                              className={`flex items-center gap-1 px-3 py-1 rounded text-[10px] font-bold uppercase border transition-all ${invFilter === type.id ? 'bg-white text-black border-white' : 'bg-transparent text-gray-500 border-white/10 hover:border-white/30'}`}
                           >
                              {type.icon} {type.label}
                           </button>
                        ))}
                     </div>
                     <button
                        onClick={() => { setEditingItem(null); setIsItemModalOpen(true) }}
                        className="bg-white/10 hover:bg-white/20 text-white p-2 rounded transition-colors"
                        title="Adicionar Item"
                     >
                        <FaPlus size={12} />
                     </button>
                  </div>

                  {/* --- LISTA GERAL DE ITENS --- */}
                  <div className="flex-1 space-y-2">
                     {sheet.inventario
                        .filter(i => !i.equipado) // Não mostra os já equipados aqui (ou mostra? por enquanto escondi pra não duplicar)
                        .filter(i => invFilter === 'todos' || i.tipo === invFilter)
                        .map((item, idx) => (
                           <InventoryItemCard
                              key={item.id || idx}
                              item={item}
                              allItems={sheet.inventario}
                              onUpdate={(newList) => handleUpdate('sheet.inventario', newList)}
                              onEdit={() => { setEditingItem(item); setIsItemModalOpen(true) }}
                           />
                        ))
                     }
                  </div>

                  {/* --- MODAL DE EDIÇÃO/CRIAÇÃO --- */}
                  {isItemModalOpen && (
                     <ItemEditorModal
                        item={editingItem}
                        onClose={() => setIsItemModalOpen(false)}
                        onSave={(newItem) => {
                           const listaAtual = [...sheet.inventario]
                           if (editingItem) {
                              // Edição
                              const index = listaAtual.findIndex(i => i.id === editingItem.id)
                              if (index !== -1) listaAtual[index] = newItem
                           } else {
                              // Criação
                              listaAtual.push({ ...newItem, id: Date.now().toString() })
                           }
                           handleUpdate('sheet.inventario', listaAtual)
                           setIsItemModalOpen(false)
                        }}
                     />
                  )}

               </div>
            )}

            {/* ================= RITUAIS ================= */}
            {tab === 'rituais' && (
               <div className="flex flex-col h-full animate-fade-in pb-4 space-y-4">

                  {/* --- HEADER: DT e Limites --- */}
                  <div className="bg-white/5 border border-white/10 p-4 rounded grid grid-cols-2 gap-4">

                     {/* Cálculo da DT */}
                     <div className="flex flex-col">
                        <span className="text-[10px] uppercase font-bold text-gray-500 mb-1">DT de Rituais</span>
                        <div className="flex items-center gap-2 bg-black/30 p-2 rounded border border-white/5">
                           <div className="flex flex-col items-center border-r border-white/10 pr-3">
                              <span className="text-2xl font-bold text-white">
                                 {(() => {
                                    const pePorTurno = sheet.nivel
                                    const valAtributo = sheet.atributos[dtAtributo] || 0
                                    return 10 + Math.floor(pePorTurno / 2) + valAtributo
                                 })()}
                              </span>
                              <span className="text-[8px] uppercase text-gray-500">Total</span>
                           </div>
                           <div className="flex-1 text-xs text-gray-400 font-mono">
                              <div className="flex justify-between"><span>Base</span> <span>10</span></div>
                              <div className="flex justify-between">
                                 <span>Lim/2</span>
                                 <span>{Math.floor(Math.floor(sheet.nivel / 2))}</span>
                              </div>
                              <div className="flex justify-between items-center mt-1 pt-1 border-t border-white/10">
                                 <select
                                    value={dtAtributo}
                                    onChange={e => setDtAtributo(e.target.value)}
                                    className="bg-transparent text-[10px] uppercase font-bold text-gray-400 outline-none cursor-pointer"
                                 >
                                    <option value="presenca">PRE</option>
                                    <option value="intelecto">INT</option>
                                    <option value="vigor">VIG</option>
                                    <option value="forca">FOR</option>
                                    <option value="agilidade">AGI</option>
                                 </select>
                                 <span>{sheet.atributos[dtAtributo]}</span>
                              </div>
                           </div>
                        </div>
                     </div>

                     {/* Info de PE e Botão Novo */}
                     <div className="flex flex-col justify-between items-end">
                        <div className="text-right">
                           <span className="text-[10px] uppercase font-bold text-gray-500">Limite PE/Turno</span>
                           <p className="text-xl font-bold text-white font-mono">
                              {Math.floor((sheet.nex || 5) / 5)}
                           </p>
                        </div>
                        <button
                           onClick={() => { setEditingRitual(null); setIsRitualModalOpen(true) }}
                           className="flex items-center gap-2 bg-gray-600 hover:bg-gray-500 text-white px-3 py-1.5 rounded text-xs font-bold uppercase transition-colors"
                        >
                           <FaPlus /> Novo Ritual
                        </button>
                     </div>
                  </div>

                  {/* --- LISTA DE RITUAIS --- */}
                  <div className="flex-1 space-y-4 overflow-y-auto custom-scrollbar">
                     {CIRCULOS.map(circulo => {
                        const rituaisDoCirculo = (sheet.rituais || []).filter(r => Number(r.circulo) === circulo)
                        if (rituaisDoCirculo.length === 0) return null

                        return (
                           <div key={circulo} className="space-y-2">
                              <h3 className="text-xs font-bold uppercase text-gray-500 border-b border-white/10 pb-1 pl-1">
                                 {circulo}º Círculo
                              </h3>
                              <div className="grid grid-cols-1 gap-2">
                                 {rituaisDoCirculo.map((ritual, idx) => (
                                    <RitualCard
                                       key={ritual.id || idx}
                                       ritual={ritual}
                                       index={idx} // Nota: index aqui precisa ser relativo ao array total para deletar certo, ou passe o objeto
                                       allRituals={sheet.rituais}
                                       onEdit={() => { setEditingRitual(ritual); setIsRitualModalOpen(true) }}
                                       onUpdate={(lista) => handleUpdate('sheet.rituais', lista)}
                                    />
                                 ))}
                              </div>
                           </div>
                        )
                     })}
                     {(!sheet.rituais || sheet.rituais.length === 0) && (
                        <div className="text-center py-10 opacity-30 text-sm">
                           Nenhum ritual aprendido.
                        </div>
                     )}
                  </div>

                  {/* MODAL */}
                  {isRitualModalOpen && (
                     <RitualEditorModal
                        ritual={editingRitual}
                        onClose={() => setIsRitualModalOpen(false)}
                        onSave={(newItem) => {
                           const lista = [...(sheet.rituais || [])]
                           if (editingRitual) {
                              const i = lista.findIndex(r => r.id === editingRitual.id)
                              if (i !== -1) lista[i] = newItem
                           } else {
                              lista.push({ ...newItem, id: Date.now().toString() })
                           }
                           handleUpdate('sheet.rituais', lista)
                           setIsRitualModalOpen(false)
                        }}
                     />
                  )}

               </div>
            )}

            {/* ================= DETALHES ================= */}
            {tab === 'detalhes' && (
               <div className='min-h-full flex flex-col gap-6 py-2 animate-fade-in'>

                  {/* 1. TOKEN E DADOS BÁSICOS */}
                  <div className="flex flex-col md:flex-row gap-6 bg-white/5 p-6 rounded border border-white/10 items-center md:items-start">

                     {/* TOKEN (Clicável para Upload) */}
                     <div className="relative group cursor-pointer w-40 h-40 shrink-0">
                        <div className="w-full h-full overflow-hidden shadow-2xl relative bg-black border-2 border-gray-700 rounded-lg">
                           {character.imageUrl ? (
                              <img src={character.imageUrl} className="w-full h-full object-cover" alt="Token" />
                           ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-700 bg-gray-900 text-4xl">?</div>
                           )}

                           {/* Overlay de Edição */}
                           <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <FaCamera className="text-white text-2xl mb-2" />
                              <span className="text-xs text-white uppercase font-bold">Alterar Token</span>
                           </div>
                        </div>

                        {/* Input Invisível */}
                        <input
                           type="file"
                           accept="image/*"
                           onChange={handleTokenImageUpload}
                           className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                     </div>

                     {/* APARÊNCIA (CORRIGIDO) */}
                     <div className="flex-1 w-full space-y-4">
                        <div>
                           <h3 className="text-xs font-bold text-gray-500 uppercase mb-1">Aparência</h3>
                           <AutoSaveTextarea
                              value={sheet.detalhes?.aparencia}
                              onSave={(val) => handleUpdate('sheet.detalhes.aparencia', val)}
                              className="w-full h-32 bg-black/30 border border-white/10 rounded p-3 text-sm text-gray-300 outline-none focus:border-gray-500 resize-none custom-scrollbar"
                              placeholder="Descreva como seu personagem se parece..."
                           />
                        </div>
                     </div>
                  </div>

                  {/* 2. CAMPOS DE TEXTO GRANDE (Histórico, Personalidade, Objetivo) - CORRIGIDOS */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 min-h-0">

                     <div className="flex flex-col h-full">
                        <h3 className="text-xs font-bold text-gray-500 uppercase mb-1">Personalidade</h3>
                        <AutoSaveTextarea
                           value={sheet.detalhes?.personalidade}
                           onSave={(val) => handleUpdate('sheet.detalhes.personalidade', val)}
                           className="w-full flex-1 bg-white/5 border border-white/10 rounded p-4 text-sm text-gray-300 outline-none focus:border-gray-500 resize-none custom-scrollbar min-h-[150px]"
                           placeholder="Traços de personalidade, medos, manias..."
                        />
                     </div>

                     <div className="flex flex-col h-full">
                        <h3 className="text-xs font-bold text-gray-500 uppercase mb-1">Objetivo</h3>
                        <AutoSaveTextarea
                           value={sheet.detalhes?.objetivo}
                           onSave={(val) => handleUpdate('sheet.detalhes.objetivo', val)}
                           className="w-full flex-1 bg-white/5 border border-white/10 rounded p-4 text-sm text-gray-300 outline-none focus:border-gray-500 resize-none custom-scrollbar min-h-[150px]"
                           placeholder="O que seu personagem busca?"
                        />
                     </div>

                     <div className="col-span-1 md:col-span-2 flex flex-col">
                        <h3 className="text-xs font-bold text-gray-500 uppercase mb-1">Histórico</h3>
                        <AutoSaveTextarea
                           value={sheet.detalhes?.historico}
                           onSave={(val) => handleUpdate('sheet.detalhes.historico', val)}
                           className="w-full flex-1 bg-white/5 border border-white/10 rounded p-4 text-sm text-gray-300 outline-none focus:border-gray-500 resize-none custom-scrollbar min-h-[200px]"
                           placeholder="A história da vida do seu personagem..."
                        />
                     </div>

                  </div>
               </div>
            )}

            {/* ================= ABA CONFIGURAÇÃO ================= */}
            {tab === 'config' && (
               <div className="flex flex-col gap-6 animate-fade-in pb-4 h-full">

                  <div className="bg-white/5 border border-white/10 p-4 rounded space-y-4">
                     <h3 className="text-sm font-bold text-gray-400 uppercase border-b border-white/10 pb-2">Acesso à Ficha</h3>

                     {/* Adicionar Usuário (Apenas Dono/Admin vê) */}
                     {(isOwner || isAdmin) && (
                        <div className="flex gap-2 items-end">
                           <div className="flex-1">
                              <label className="text-[10px] uppercase font-bold text-gray-500 mb-1 block">
                                 Adicionar Jogador da Campanha
                              </label>

                              <select
                                 value={selectedPlayerId}
                                 onChange={(e) => setSelectedPlayerId(e.target.value)}
                                 className="w-full bg-black/30 border border-white/20 rounded p-2 text-white text-xs outline-none focus:border-gray-500"
                              >
                                 <option value="">Selecione um jogador...</option>
                                 {shareableUsers.map(p => (
                                    <option key={p._id} value={p._id}>
                                       {p.username}
                                    </option>
                                 ))}
                              </select>
                           </div>

                           <button
                              onClick={async () => {
                                 if (!selectedPlayerId) return alert("Selecione alguém!")

                                 try {
                                    // Manda o ID selecionado
                                    const { data: updatedChar } = await api.post(`/characters/${character._id}/share`, {
                                       targetUserId: selectedPlayerId
                                    })

                                    if (onUpdate) onUpdate(updatedChar)
                                    setSelectedPlayerId('') // Reseta o select
                                    alert("Acesso concedido!")
                                 } catch (err) {
                                    alert(err.response?.data?.message || "Erro ao adicionar")
                                 }
                              }}
                              disabled={!selectedPlayerId}
                              className="bg-gray-600 hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded text-xs font-bold uppercase transition-colors flex items-center gap-2 h-[34px]"
                           >
                              <FaUserPlus /> Confirmar
                           </button>
                        </div>
                     )}

                     {availablePlayers.length === 0 && (isOwner || isAdmin) && (
                        <p className="text-[10px] text-gray-500 italic">Todos os membros da campanha já têm acesso.</p>
                     )}

                     {/* Lista de Usuários */}
                     <div className="space-y-2 mt-4">
                        {/* Dono (Fixo) */}
                        <div className="flex justify-between items-center bg-black/40 p-2 rounded border border-gray-500/30">
                           <div className="flex flex-col">
                              <span className="text-white text-sm font-bold">{character.owner?.name}</span>
                              <span className="text-xs text-gray-500">{character.owner?.email}</span>
                           </div>
                           <span className="text-[10px] uppercase font-bold text-gray-500 bg-gray-500/10 px-2 py-1 rounded">Dono</span>
                        </div>

                        {/* Usuários Compartilhados */}
                        {(character.sharedWith || []).map(userShared => (
                           <div key={userShared._id} className="flex justify-between items-center bg-black/40 p-2 rounded border border-white/10">
                              <div className="flex flex-col">
                                 <span className="text-white text-sm font-bold">{userShared.name}</span>
                                 <span className="text-xs text-gray-500">{userShared.email}</span>
                              </div>

                              {/* Botão Remover (Só Dono/Admin pode remover, e não pode remover a si mesmo aqui se fosse o caso) */}
                              {(isOwner || isAdmin) && (
                                 <button
                                    onClick={async () => {
                                       if (!confirm(`Remover acesso de ${userShared.name}?`)) return
                                       try {
                                          const { data: updatedChar } = await api.delete(`/characters/${character._id}/share`, { data: { userIdToRemove: userShared._id } })
                                          if (onUpdate) onUpdate(updatedChar)
                                       } catch (err) {
                                          alert("Erro ao remover usuário")
                                       }
                                    }}
                                    className="text-red-500 hover:text-red-300 p-2 rounded transition-colors"
                                    title="Remover Acesso"
                                 >
                                    <FaUserTimes />
                                 </button>
                              )}
                           </div>
                        ))}

                        {(!character.sharedWith || character.sharedWith.length === 0) && (
                           <p className="text-center text-xs text-gray-600 italic py-2">Nenhum outro usuário tem acesso.</p>
                        )}
                     </div>
                  </div>

                  <div className="bg-red-900/10 border border-red-500/20 p-4 rounded">
                     <h3 className="text-sm font-bold text-red-400 uppercase mb-2">Zona de Perigo</h3>
                     <button
                        onClick={async () => {
                           const confirmName = prompt(`Para deletar digite o nome do personagem: ${character.name}`)
                           if (confirmName === character.name) {
                              await api.delete(`/characters/${character._id}`)
                              if (onDelete) onDelete(character._id)
                           }
                        }}
                        className="w-full border border-red-500/50 text-red-500 hover:bg-red-500 hover:text-white px-4 py-2 rounded text-xs font-bold uppercase transition-colors"
                     >
                        Deletar Personagem
                     </button>
                  </div>

               </div>
            )}

            {/* ================= DEBUG (JSON CRU) ================= */}
            {tab === 'debug' && (
               <div className="h-full flex flex-col gap-2">
                  <div className="flex justify-between items-center border-b border-gray-800 pb-2">
                     <h3 className="text-yellow-500 font-bold uppercase text-sm flex items-center gap-2">
                        <FaBug /> Editor Raw (Cuidado!)
                     </h3>
                     <button
                        onClick={handleSaveRawJson}
                        className="bg-green-700 hover:bg-green-600 text-white text-xs font-bold uppercase px-3 py-1 rounded flex items-center gap-2 transition-colors"
                     >
                        <FaSave /> Salvar Alterações
                     </button>
                  </div>

                  {/* Mostra erro se o JSON for inválido */}
                  {jsonError && (
                     <div className="bg-red-900/50 border border-red-500 text-red-200 p-2 rounded text-xs">
                        {jsonError}
                     </div>
                  )}

                  {/* Área de Texto Editável */}
                  <textarea
                     className={`flex-1 w-full bg-black font-mono text-xs text-green-400 p-4 rounded border shadow-inner resize-none focus:outline-none focus:border-green-700 custom-scrollbar ${jsonError ? 'border-red-500' : 'border-gray-800'}`}
                     value={debugJson}
                     onChange={(e) => {
                        setDebugJson(e.target.value)
                        setJsonError(null)
                     }}
                     spellCheck="false"
                  />
               </div>
            )}
         </div>
      </div >
   )
}

export default OrdemParanormalSheet