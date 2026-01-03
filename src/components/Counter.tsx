import type { GroupDetailDTO } from '@/types';
import { useState } from 'react';
import { Button } from './ui/button';

export default function Counter() {
    const [count, setCount] = useState(0);

    return (
        <div style={{ border: '2px dashed blue', padding: '10px', margin: '10px 0' }}>
            <p>Licznik Reacta: {count}</p>
            <Button variant="outline">Click me</Button>
            <button onClick={() => setCount(count + 1)}>+</button>
        </div>
    );
}
