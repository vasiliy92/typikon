import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import type { Messages } from '@/i18n/config';

const fr = (await import('./messages/fr.json')).default as Messages;
const en = (await import('./messages/en.json')).default as Messages;
const ru = (await import('./messages/ru.json')).default as Messages;

const messages: Record<string, Messages> = { fr, en, ru };

// ... rest of i18n.tsx unchanged
