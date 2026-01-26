import OrdemSheet from './OrdemParanormalSheet'
import SimpleSheet from './SimpleSheet'

const SheetManager = ({ character, system, onUpdate, campaignPlayers, onDelete }) => {

   const systemKey = system ? system.toLowerCase().replace(/ /g, '-') : 'default'

   const SHEETS = {
      'ordem-paranormal': OrdemSheet,
      'default': SimpleSheet
   }

   // Escolhe o componente ou usa o default
   const SelectedSheet = SHEETS[systemKey] || SHEETS['default']

   return <SelectedSheet data={character} onUpdate={onUpdate} campaignPlayers={campaignPlayers} onDelete={onDelete} />
}

export default SheetManager