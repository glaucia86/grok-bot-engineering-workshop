// @vitest-environment happy-dom
import React from 'react';
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { WorkshopShell } from './workshop-shell';
import { LocaleProvider } from './locale-provider';
const route=vi.hoisted(()=>({pathname:'/feedback'}));
vi.mock('next/navigation',()=>({usePathname:()=>route.pathname}));
afterEach(()=>{cleanup();localStorage.clear();});
it.each(['/','/feedback','/results'])('uses the same accessible header on %s',pathname=>{route.pathname=pathname;render(<WorkshopShell><h1>Page</h1></WorkshopShell>);const nav=screen.getByRole('navigation',{name:'Main navigation'});expect(nav.closest('header')).toBeTruthy();expect(within(nav).getAllByRole('link').map(a=>a.getAttribute('href'))).toEqual(['/','/feedback','/results']);expect(nav.querySelector('[aria-current=page]')?.getAttribute('href')).toBe(pathname);expect(screen.getByRole('main').id).toBe('main-content');});
it('exposes both languages and localizes navigation without remounting children',()=>{render(<LocaleProvider><WorkshopShell><input aria-label='Draft' defaultValue='Saved thought'/></WorkshopShell></LocaleProvider>);fireEvent.click(screen.getByRole('button',{name:'PT-BR'}));expect(screen.getByRole('navigation',{name:'Navegação principal'})).toBeTruthy();expect(screen.getByRole('button',{name:'PT-BR'}).getAttribute('aria-pressed')).toBe('true');expect((screen.getByLabelText('Draft') as HTMLInputElement).value).toBe('Saved thought');});
