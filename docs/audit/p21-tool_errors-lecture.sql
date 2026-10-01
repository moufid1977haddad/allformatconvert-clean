-- P21 (02/10) — LECTURE SEULE de tool_errors depuis la purge du 28/09, pour la phase 2 (erreurs réelles des visiteurs).
-- À exécuter par le propriétaire : Supabase → SQL Editor → coller → Run ; puis « Download CSV » de chaque résultat
-- (ou copier le tableau) et le poser dans Téléchargements : Claude le lira et reproduira chaque cause.
-- Aucune écriture : uniquement des SELECT. (Claude n'a pas accès à la clé service, règle permanente du 28/08.)

-- 1) Regroupement par outil et par cause
select tool, source, error_type, left(error_message, 160) as message, ext, detected_ext, browser,
       count(*) as n, min(created_at) as first_seen, max(created_at) as last_seen
from tool_errors
where created_at >= '2026-09-28'
group by tool, source, error_type, left(error_message, 160), ext, detected_ext, browser
order by n desc, last_seen desc;

-- 2) Toutes les lignes, pour le détail (taille approximative, navigateur)
select id, created_at, tool, source, ext, detected_ext, size_bucket, error_type, error_message, browser
from tool_errors
where created_at >= '2026-09-28'
order by created_at desc;
