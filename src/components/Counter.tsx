import type { GroupDetailDTO } from '@/types';
import { useState } from 'react';

export default function Counter() {
    const [count, setCount] = useState(0);

    return (
        <div style={{ border: '2px dashed blue', padding: '10px', margin: '10px 0' }}>
            <p>Licznik Reacta: {count}</p>
            <button onClick={() => setCount(count + 1)}>+</button>
        </div>
    );
}
