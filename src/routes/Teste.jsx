import { Stage, Layer, Group, Rect, Text as KonvaText } from 'react-konva';
import { useState } from 'react';

const createInitialShapes = () => {
   const shapes = [];
   for (let i = 0; i < 10; i++) {
      const width = 30 + Math.random() * 30;
      const height = 30 + Math.random() * 30;
      const rotation = 360 * Math.random();

      // calculate bounding box for rotated rectangle
      const radians = (rotation * Math.PI) / 180;
      const cos = Math.cos(radians);
      const sin = Math.sin(radians);

      // calculate corners of the rectangle
      const corners = [
         { x: 0, y: 0 },
         { x: width, y: 0 },
         { x: width, y: height },
         { x: 0, y: height }
      ].map(point => ({
         x: point.x * cos - point.y * sin,
         y: point.x * sin + point.y * cos
      }));

      // find bounding box dimensions
      const minX = Math.min(...corners.map(p => p.x));
      const maxX = Math.max(...corners.map(p => p.x));
      const minY = Math.min(...corners.map(p => p.y));
      const maxY = Math.max(...corners.map(p => p.y));

      shapes.push({
         id: i,
         x: Math.random() * window.innerWidth,
         y: Math.random() * window.innerHeight,
         rotation,
         width,
         height,
         fill: 'grey',
         box: {
            x: minX,
            y: minY,
            width: maxX - minX,
            height: maxY - minY
         }
      });
   }
   return shapes;
};

const haveIntersection = (r1, r2) => {
   return !(
      r2.x > r1.x + r1.width ||
      r2.x + r2.width < r1.x ||
      r2.y > r1.y + r1.height ||
      r2.y + r2.height < r1.y
   );
};

const Teste = () => {
   const[shapes, setShapes] = useState(createInitialShapes());
   const [debug, setDebug] = useState(null)

   const handleDragMove = (e, id) => {
      const target = e.target;
      const targetRect = target.getClientRect();

      setShapes(shapes.map(shape => {
         if (shape.id === id) {
            return shape;
         }
         const shapeGroup = target.parent.parent.findOne(`#group-${shape.id}`);
         setDebug(shapeGroup)
         if (!shapeGroup) return shape;

         console.log(shapeGroup)

         const isIntersecting = haveIntersection(
            shapeGroup.getClientRect(),
            targetRect
         );

         return {
            ...shape,
            fill: isIntersecting ? 'red' : 'grey'
         };
      }));
   };

   const handleDragEnd = (e, id) => {
      setShapes(shapes.map(shape =>
         shape.id === id
            ? { ...shape, x: e.target.x(), y: e.target.y() }
            : shape
      ));
   };

   return (
      <Stage width={window.innerWidth} height={window.innerHeight}>
         <Layer>
            <KonvaText
               x={8}
               y={8}
               text={String(debug)}
               fill="black"
               fontSize={20}
               fontStyle="bold"
               shadowColor="black"
               shadowBlur={1}
            />
            {shapes.map((shape) => (
               <Group
                  key={shape.id}
                  id={`group-${shape.id}`}
                  x={shape.x}
                  y={shape.y}
                  draggable
                  onDragMove={(e) => handleDragMove(e, shape.id)}
                  onDragEnd={(e) => handleDragEnd(e, shape.id)}
               >
                  <Rect
                     width={shape.width}
                     height={shape.height}
                     fill={shape.fill}
                     rotation={shape.rotation}
                     name="fillShape"
                  />
               </Group>
            ))}
         </Layer>
      </Stage>
   )
}

export default Teste