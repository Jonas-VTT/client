const SimpleSheet = ({ data }) => {
   return (
      <div className="p-2">
         <h3 className="text-yellow-500 font-bold mb-2">Ficha Genérica</h3>
         <pre className="text-xs bg-black p-2 rounded text-green-400 overflow-auto">
            {JSON.stringify(data.sheet, null, 2)}
         </pre>
      </div>
   )
}

export default SimpleSheet