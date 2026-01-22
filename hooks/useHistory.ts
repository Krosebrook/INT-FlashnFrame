
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { useState, useCallback } from 'react';

export function useHistory<T>(initialState: T) {
    const [state, setState] = useState<T>(initialState);
    const [past, setPast] = useState<T[]>([]);
    const [future, setFuture] = useState<T[]>([]);

    const set = useCallback((newState: T | ((prev: T) => T)) => {
        setState((currentState) => {
            const nextState = typeof newState === 'function' 
                ? (newState as (prev: T) => T)(currentState) 
                : newState;
            
            if (nextState !== currentState) {
                setPast((prevPast) => [...prevPast, currentState]);
                setFuture([]);
            }
            return nextState;
        });
    }, []);

    const undo = useCallback(() => {
        setPast((prevPast) => {
            if (prevPast.length === 0) return prevPast;
            const newPast = [...prevPast];
            const previousState = newPast.pop() as T;
            
            setFuture((prevFuture) => [state, ...prevFuture]);
            setState(previousState);
            
            return newPast;
        });
    }, [state]);

    const redo = useCallback(() => {
        setFuture((prevFuture) => {
            if (prevFuture.length === 0) return prevFuture;
            const newFuture = [...prevFuture];
            const nextState = newFuture.shift() as T;
            
            setPast((prevPast) => [...prevPast, state]);
            setState(nextState);
            
            return newFuture;
        });
    }, [state]);

    return {
        state,
        set,
        undo,
        redo,
        canUndo: past.length > 0,
        canRedo: future.length > 0
    };
}
