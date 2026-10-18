// @vitest-environment happy-dom
import React from 'react';
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import Home from '../app/page';
import { LocaleProvider } from './locale-provider';
afterEach(()=>{cleanup();localStorage.clear();vi.unstubAllGlobals();});
it('carries a chosen rating into the real feedback flow without submitting',()=>{vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,json:async()=>[]}));render(<Home/>);fireEvent.click(screen.getByRole('radio',{name:'4 stars'}));expect(screen.getByRole('link',{name:'Continue with my rating'}).getAttribute('href')).toBe('/feedback?rating=4');expect(screen.queryByText('67')).toBeNull();});
it('renders the Portuguese heading and honest privacy requirements',()=>{localStorage.setItem('talkfeedback-locale','pt-BR');vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,json:async()=>[]}));render(<LocaleProvider><Home/></LocaleProvider>);expect(screen.getByRole('heading',{level:1}).textContent).toBe('O palco fala.A plateia responde.');expect(screen.getByText('Talk, nome e nota são obrigatórios. O comentário é opcional.')).toBeTruthy();});
