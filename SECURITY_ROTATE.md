Rotacionar e proteger SUPABASE_SERVICE_ROLE_KEY

Passos recomendados (rápido):

1. No painel do Supabase: Project → Settings → API → Regenerate Service Role Key (rotacione).
2. No provedor de deploy (Vercel, Netlify, Render ou GitHub Actions), adicione a nova chave como variável de ambiente/secret:
   - Nome sugerido: `SUPABASE_SERVICE_ROLE_KEY` (server-only)
3. Remova a chave do repositório local e remoto:
   - `git rm --cached .env`  (isso remove do índice, não de seu disco)
   - `git commit -m "chore(security): remove .env from repo"`
   - `git push`
4. Verifique se a aplicação em produção (Vercel) possui a variável `SUPABASE_SERVICE_ROLE_KEY` configurada e sem exposição no frontend.
5. Rotacione quaisquer tokens/keys que tenham sido expostos (e.g., regen anon keys se necessário) e atualize as variáveis de ambiente.
6. Confirme que o workflow CI (`.github/workflows/ci.yml`) executa `node scripts/check_secrets.js` e falhará se arquivos contendo chaves estiverem no repositório.

Notas:
- A remoção do arquivo `.env` do histórico Git exige ferramentas como `git filter-repo` / `BFG` para remover do histórico antigo; o passo acima apenas evita commits futuros.
- Se quiser, posso executar a remoção do `.env` do índice e criar o commit/push agora, e orientar a rotação das chaves no Supabase.
