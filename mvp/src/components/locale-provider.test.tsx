// @vitest-environment happy-dom
import React from 'react';
import { afterEach, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { LocaleProvider, useLocale } from './locale-provider';
function Probe(){const {locale,setLocale,t,number}=useLocale();return <><p>{t('Hello','Olá')} {number(4.3,1)}</p><button onClick={()=>setLocale(locale==='en-US'?'pt-BR':'en-US')}>Toggle</button></>}
afterEach(()=>{cleanup();localStorage.clear();});
it('defaults to English and updates visible copy, document language and saved preference',()=>{render(<LocaleProvider><Probe/></LocaleProvider>);expect(screen.getByText('Hello 4.3')).toBeTruthy();fireEvent.click(screen.getByText('Toggle'));expect(screen.getByText('Olá 4,3')).toBeTruthy();expect(document.documentElement.lang).toBe('pt-BR');expect(localStorage.getItem('talkfeedback-locale')).toBe('pt-BR');});
it('restores a valid preference and ignores invalid values',()=>{localStorage.setItem('talkfeedback-locale','pt-BR');const {unmount}=render(<LocaleProvider><Probe/></LocaleProvider>);expect(screen.getByText('Olá 4,3')).toBeTruthy();unmount();localStorage.setItem('talkfeedback-locale','xx');render(<LocaleProvider><Probe/></LocaleProvider>);expect(screen.getByText('Hello 4.3')).toBeTruthy();});
it('keeps child form values when changing language',()=>{render(<LocaleProvider><input aria-label='draft' defaultValue='Keep this'/><Probe/></LocaleProvider>);fireEvent.click(screen.getByText('Toggle'));expect((screen.getByLabelText('draft') as HTMLInputElement).value).toBe('Keep this');});
