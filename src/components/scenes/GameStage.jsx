import { useState, useEffect, useRef } from 'react'
import api from '../../config/api'
import { FaCloudUploadAlt, FaSpinner, FaPlay, FaPause, FaVolumeMute, FaVolumeUp, FaForward } from 'react-icons/fa'

import MapStage from './MapStage'

const isVideoFile = (url) => {
  if (!url) return false
  return url.match(/\.(mp4|webm|ogg|mov)$/i)
}

const GameStage = ({ activeScene, onActivateScene, onSceneUpdate, isMaster, socket, campaignId, isSidebarOpen }) => {
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)

  const videoRef = useRef(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [videoOpacity, setVideoOpacity] = useState(0)
  const [enableTransition, setEnableTransition] = useState(false)

  const [nextSceneId, setNextSceneId] = useState('')
  const [availableScenes, setAvailableScenes] = useState([])
  const [folders, setFolders] = useState([])

  useEffect(() => {
    setIsPlaying(false)
    setIsMuted(false)
    setVideoOpacity(0)
    setEnableTransition(false)
    setNextSceneId('')

    if (activeScene?.type === 'background' || activeScene?.type === 'map') {
      setVideoOpacity(1)
    }
  }, [activeScene?._id])

  useEffect(() => {
    if (isMaster && activeScene?.type === 'cutscene') {
      Promise.all([
        api.get(`/scenes/campaign/${campaignId}`),
        api.get(`/scenes/folders/${campaignId}`)
      ]).then(([scenesRes, foldersRes]) => {
        setAvailableScenes(scenesRes.data.filter(s => s._id !== activeScene._id))
        setFolders(foldersRes.data)
      })
    }
  }, [isMaster, activeScene, campaignId])

  useEffect(() => {
    if (!socket) return

    const handleMediaCommand = ({ action, value }) => {
      if (!videoRef.current) return

      switch (action) {
        case 'play':
          videoRef.current.play().catch(e => console.log("Autoplay block:", e))
          setIsPlaying(true)
          setVideoOpacity(1)
          break;

        case 'pause':
          videoRef.current.pause()
          setIsPlaying(false)
          break;

        case 'mute_sync':
          setIsMuted(value)
          break;

        case 'start_transition':
          setVideoOpacity(0)
          break;
      }
    }

    socket.on('media_command_received', handleMediaCommand)
    return () => socket.off('media_command_received', handleMediaCommand)
  }, [socket])

  const handleUpload = async (file) => {
    if (!isMaster) return
    if (!file) return
    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const folderType = file.type.startsWith('video/') ? 'videos' : 'images'
      const { data: uploadData } = await api.post(`/upload/${folderType}`, formData)

      const { data: updatedScene } = await api.put(`/scenes/${activeScene._id}`, {
        media: {
          url: uploadData.url,
          loop: true,
          muted: false
        }
      })

      if (onSceneUpdate) onSceneUpdate(updatedScene)
    }
    catch (error) {
      console.error("Erro no upload do palco:", error)
    }
    finally {
      setUploading(false)
      setIsDragging(false)
    }
  }
  const handleMasterPlay = () => {
    if (!socket) return
    socket.emit('gm_media_command', { campaignId, action: 'play' })
  }
  const handleMasterPause = () => {
    if (!socket) return
    socket.emit('gm_media_command', { campaignId, action: 'pause' })
  }
  const handleMasterMute = () => {
    if (!socket) return
    const newState = !isMuted
    socket.emit('gm_media_command', { campaignId, action: 'mute_sync', value: newState })
  }
  const handleTransitionToEnd = () => {
    if (!socket) return

    socket.emit('gm_media_command', { campaignId, action: 'start_transition' })

    setTimeout(() => {
      if (nextSceneId) {
        onActivateScene(nextSceneId)
      } else {
        console.warn("Nenhuma próxima cena selecionada!")
      }
    }, 1500)
  }

  const onVideoEnded = () => {
    if (isMaster && activeScene.type === 'cutscene') {
      handleTransitionToEnd()
    }
  }
  const onDragOver = (e) => {
    e.preventDefault()
    if (isMaster) setIsDragging(true)
  }
  const onDragLeave = (e) => {
    e.preventDefault()
    if (isMaster) setIsDragging(false)
  }
  const onDrop = (e) => {
    e.preventDefault()
    if (!isMaster) return

    const file = e.dataTransfer.files[0]
    const isImage = file.type.startsWith('image/')
    const isVideo = file.type.startsWith('video/')

    if (activeScene.type === 'map') {
      if (!isImage) return alert("Mapas devem ser Imagens estáticas!")
    }
    else if (activeScene.type === 'cutscene') {
      if (!isVideo) return alert("Cutscenes devem ser Vídeos!")
    }
    else if (activeScene.type === 'background') {
      if (!isImage && !isVideo) return alert("Background aceita apenas Imagem ou Vídeo!")
    }

    handleUpload(file)
  }

  // SEM CENA ATIVA
  if (!activeScene) {
    return (
      <div className="absolute inset-0 bg-[#09090a] flex flex-col items-center justify-center -z-10 select-none">
        <h1 className="text-gray-800 font-black text-4xl uppercase tracking-widest mb-4">Sem Cena Ativa</h1>
      </div>
    )
  }

  // CENA ATIVA, MAS SEM ARQUIVO (URL VAZIA)
  if (!activeScene.media?.url && activeScene.type !== 'map') {
    if (!isMaster) {
      return (
        <div className="absolute inset-0 bg-black -z-10 flex items-center justify-center">
          <span className="text-gray-800 text-[10px] uppercase">Preparando Cenário...</span>
        </div>
      )
    }

    return (
      <div
        className={`absolute inset-0 -z-10 flex flex-col items-center justify-center transition-all duration-300
               ${isDragging ? 'bg-gray-900/40 border-4 border-gray-500 border-dashed' : 'bg-[#121214]'}
            `}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        {uploading ? (
          <div className="flex flex-col items-center animate-pulse">
            <FaSpinner className="text-5xl text-gray-500 animate-spin mb-4" />
            <span className="text-gray-400 font-bold uppercase tracking-wider">Enviando Arquivo...</span>
          </div>
        ) : (
          <div className="text-center group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            <div className={`w-32 h-32 rounded-full flex items-center justify-center mb-6 mx-auto transition-all
                     ${isDragging ? 'bg-gray-500 scale-110' : 'bg-gray-800 group-hover:bg-gray-600'}
                  `}>
              <FaCloudUploadAlt className="text-5xl text-white" />
            </div>

            <h2 className="text-2xl font-bold text-gray-300 mb-2">
              Cena: <span className="text-white">{activeScene.name}</span>
            </h2>
            <p className="text-gray-500 text-sm uppercase font-bold tracking-wider mb-8">
              {isDragging ? "Solte para enviar!" : `Arraste ${activeScene.type === 'video' ? 'um Vídeo' : 'uma Imagem'} ou clique aqui`}
            </p>

            <div className="inline-block bg-gray-800 px-4 py-2 rounded text-xs text-gray-400 font-mono">
              {activeScene.type === 'map' ? 'Mapa' : activeScene.type === 'video' ? 'Vídeo' : 'Imagem'}
            </div>

            {/* Input escondido */}
            <input
              type="file"
              className="hidden"
              ref={fileInputRef}
              accept={activeScene.type === 'video' ? 'video/*' : 'image/*'}
              onChange={(e) => handleUpload(e.target.files[0])}
            />
          </div>
        )}
      </div>
    )
  }

  const mediaUrl = activeScene.media.url
  const isVideoContent = isVideoFile(mediaUrl)

  if (activeScene.type === 'cutscene') {
    return (
      <div className="absolute inset-0 bg-black -z-10 overflow-hidden">

        {/* VÍDEO */}
        <video
          key={activeScene._id}
          ref={videoRef}
          src={activeScene.media.url}
          className="w-full h-full object-cover transition-opacity duration-1500 ease-in-out" // TRANSITION SMOOTHIE
          style={{ opacity: videoOpacity }}
          muted={isMuted}
          onEnded={onVideoEnded}
        />

        {/* CONTROLES DO MESTRE (Canto Superior Esquerdo) */}
        {isMaster && (
          <div className="absolute top-16 left-4 bg-black/80 backdrop-blur border border-gray-700 p-3 rounded-lg flex flex-col gap-3 w-64 shadow-2xl z-50 animate-fade-in">
            <div className="flex justify-between items-center border-b border-gray-700 pb-2">
              <span className="text-xs font-bold text-indigo-400 uppercase">Controle de Cena</span>
              <div className="flex gap-2">
                <button onClick={handleMasterMute} className="text-gray-400 hover:text-white">
                  {isMuted ? <FaVolumeMute /> : <FaVolumeUp />}
                </button>
              </div>
            </div>

            {/* Play / Pause */}
            <div className="flex gap-2">
              {!isPlaying ? (
                <button onClick={handleMasterPlay} className="flex-1 bg-green-600 hover:bg-green-500 text-white py-2 rounded flex items-center justify-center gap-2 font-bold text-xs uppercase transition-colors">
                  <FaPlay size={10} /> Play Todos
                </button>
              ) : (
                <button onClick={handleMasterPause} className="flex-1 bg-yellow-600 hover:bg-yellow-500 text-white py-2 rounded flex items-center justify-center gap-2 font-bold text-xs uppercase transition-colors">
                  <FaPause size={10} /> Pause
                </button>
              )}
            </div>

            {/* Seletor de Destino */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-gray-500 uppercase font-bold">Próxima Cena:</label>
              <select
                className="bg-gray-800 border border-gray-600 text-white text-xs p-2 rounded outline-none focus:border-indigo-500"
                value={nextSceneId}
                onChange={(e) => setNextSceneId(e.target.value)}
              >
                <option value="">-- Selecione o destino --</option>

                {/* Cenas na Raiz */}
                <optgroup label="Raiz">
                  {availableScenes.filter(s => !s.folder).map(s => (
                    <option key={s._id} value={s._id}>{s.name} ({s.type})</option>
                  ))}
                </optgroup>

                {/* Cenas por Pasta */}
                {folders.map(folder => {
                  const scenesInFolder = availableScenes.filter(s => s.folder === folder._id)
                  if (scenesInFolder.length === 0) return null
                  return (
                    <optgroup key={folder._id} label={folder.name}>
                      {scenesInFolder.map(s => (
                        <option key={s._id} value={s._id}>{s.name} ({s.type})</option>
                      ))}
                    </optgroup>
                  )
                })}
              </select>
            </div>

            {/* Botão de Pular Transição */}
            <button
              onClick={handleTransitionToEnd}
              disabled={!nextSceneId}
              className="mt-1 border border-gray-600 text-gray-400 hover:text-white hover:bg-white/10 py-1 rounded text-[10px] uppercase flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <FaForward /> Pular Vídeo & Ir
            </button>
          </div>
        )}
      </div>
    )
  }

  if (activeScene.type === 'background' && isVideoContent) {
    return (
      <div className="absolute inset-0 bg-black -z-10 overflow-hidden">
        <video src={mediaUrl} autoPlay loop muted className="w-full h-full object-cover" />
      </div>
    )
  }

  if (activeScene.type === 'background') {
    if (isVideoContent) {
      return <div className="absolute inset-0 bg-black -z-10"><video src={mediaUrl} autoPlay loop muted className="w-full h-full object-cover" /></div>
    }
    return <div className="absolute inset-0 bg-black -z-10"><img src={mediaUrl} className="w-full h-full object-cover" alt="Background" /></div>
  }

  if (activeScene.type === 'map') {
    return (
      <MapStage
        activeScene={activeScene}
        isMaster={isMaster}
        socket={socket}
        onUpdateScene={onSceneUpdate}
        isSidebarOpen={isSidebarOpen}
      />
    )
  }
}

export default GameStage