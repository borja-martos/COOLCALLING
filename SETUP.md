# CoolCalling — Setup en 5 pasos

## 1. Instalar dependencias

```bash
cd "COOL CALLING FOCUS/coolcalling"
npm install
```

## 2. Crear proyecto en Supabase

1. Ir a https://supabase.com → New Project
2. Copiar `URL` y `anon key` del proyecto

## 3. Crear tablas en Supabase

1. Ir a **SQL Editor** en Supabase
2. Pegar y ejecutar el contenido de `database/schema.sql`

## 4. Configurar variables de entorno

```bash
cp .env.example .env.local
```

Editar `.env.local` con tus claves:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
ANTHROPIC_API_KEY=sk-ant-...
```

## 5. Arrancar

```bash
npm run dev
```

Abre http://localhost:3000

---

## Flujo de uso

1. Regístrate con email + contraseña
2. Ve a **Leads** → sube tu Excel (columnas: nombre, teléfono, web)
3. Espera a que la IA analice las empresas
4. Pulsa **Iniciar sesión** → Modo Foco
5. Llama, dicta notas, clasifica resultado
6. El email de seguimiento se genera solo

---

## Excel de ejemplo

| nombre       | telefono      | web                  |
|--------------|---------------|----------------------|
| Gympass      | 912345678     | gympass.com          |
| Factorial HR | 934567890     | factorialhr.com      |
| Personio     | 911234567     | personio.com         |
