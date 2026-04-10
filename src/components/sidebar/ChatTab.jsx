import { useState, useEffect, useRef } from 'react'
import { DiceRoll } from '@dice-roller/rpg-dice-roller'
import { IoSend } from "react-icons/io5"
import { FaDiceD20, FaEyeSlash } from "react-icons/fa"

const ChatTab = ({ socket, campaignId, user, isMaster }) => {
   const [messages, setMessages] = useState([])
   const [input, setInput] = useState('')
   const bottomRef = useRef(null)

   useEffect(() => {
      bottomRef.current?.scrollIntoView()
   }, [messages])
   useEffect(() => {
      if (!socket || !campaignId) return

      socket.emit('join_campaign', campaignId)
      socket.emit('fetch_chat_history', campaignId)

      const handleHistory = (history) => {
         setMessages(history);
      }

      const handleNewMessage = (msg) => {
         setMessages(prev => [...prev, msg])
      }

      socket.on('chat_history', handleHistory)
      socket.on('chat_message', handleNewMessage)

      return () => {
         socket.off('chat_history', handleHistory)
         socket.off('chat_message', handleNewMessage)
      }
   }, [socket, campaignId])

   const handleSend = (e) => {
      e.preventDefault()
      if (!input.trim()) return

      let messageData = {
         campaignId,
         sender: user.name || 'Anônimo',
         senderId: user.id,
         type: 'text',
         isBlind: false,
         content: input,
         timestamp: new Date()
      }

      if (input.match(/^\/(r|roll|rg)\s/)) {
         try {
            const isBlindRoll = input.startsWith('/rg ')
            const formula = input.replace(/^\/(r|roll|rg)\s+/, '')
            const roll = new DiceRoll(formula)

            messageData.type = 'roll'
            messageData.isBlind = isBlindRoll
            messageData.content = {
               formula: formula,
               total: roll.total,
               output: roll.output
            }
         }
         catch (err) {
            alert("Fórmula de dado inválida!")
            return
         }
      }

      if (messageData.type != "roll") return

      socket.emit('send_message', messageData)
      setInput('')
   }

   return (
      <div className="flex flex-col h-full bg-[#121214]">
         <div className="h-13/14 flex-1 overflow-y-scroll p-4 space-y-3 custom-scrollbar">
            {messages.map((msg, i) => {
               const messageKey = msg._id || i;
               const canSee = !msg.isBlind || isMaster || msg.senderId === user.id

               if (canSee) {
                  return (
                     <div key={messageKey} className={`bg-gray-800 p-2 rounded border border-gray-700 ${msg.type === 'roll' ? 'border-l-4 border-l-purple-500' : ''}`}>
                        <span className="text-xs font-bold text-gray-400 block mb-1">
                           <span className={`text-xs font-bold flex items-center gap-1 ${msg.type === 'roll' ? 'text-purple-400' : 'text-gray-400'}`}>
                              {msg.sender}
                              {msg.isBlind && (
                                 <FaEyeSlash className="text-gray-500" title="Rolagem Oculta (Mestre)" />
                              )}
                           </span>

                        </span>

                        {msg.type === 'roll' ? (
                           <div className="text-gray-200">
                              <div className="text-xs text-gray-500 font-mono">{msg.content.formula}</div>
                              <div className="text-xl font-bold flex items-center gap-2">
                                 <FaDiceD20 /> {msg.content.total}
                              </div>
                              <div className="text-[10px] text-gray-600 truncate" title={msg.content.output}>
                                 {msg.content.output}
                              </div>
                           </div>
                        ) : (
                           <p className="text-sm text-gray-200">{msg.content}</p>
                        )}
                     </div>
                  )
               }
            })}
            <div ref={bottomRef} />
         </div>

         <form onSubmit={handleSend} className="h-1/14 p-2 border-t border-gray-700 flex gap-2">
            <input
               className="flex-1 bg-black text-white text-sm p-2 rounded outline-none focus:ring-1 focus:ring-purple-500"
               placeholder="Digite ou /r 1d20"
               value={input}
               onChange={e => setInput(e.target.value)}
            />
            <button type="submit" className="text-purple-400 hover:text-white p-2">
               <IoSend />
            </button>
         </form>
      </div >
   )
}

export default ChatTab