-- Convert posts content from Markdown to HTML
-- Esegue la conversione via pg_tgrm con regexp per pattern base.
-- Per una conversione completa, eseguire: node scripts/convert-md-to-html.mjs

create or replace function crude_md_to_html(md text)
returns text language plpgsql immutable as $$
declare
  html text;
begin
  html := md;

  -- headings ## e ###
  html := regexp_replace(html, '^### (.+)$', '<h3>\1</h3>', 'gm');
  html := regexp_replace(html, '^## (.+)$', '<h2>\1</h2>', 'gm');

  -- bold **text**
  html := regexp_replace(html, '\*\*(.+?)\*\*', '<strong>\1</strong>', 'g');
  html := regexp_replace(html, '__(.+?)__', '<strong>\1</strong>', 'g');

  -- italic *text*
  html := regexp_replace(html, '(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)', '<em>\1</em>', 'g');
  html := regexp_replace(html, '_(.+?)_', '<em>\1</em>', 'g');

  -- unordered list items
  html := regexp_replace(html, '^[\*\-]\s+(.+)$', '<li>\1</li>', 'gm');
  -- ordered list items
  html := regexp_replace(html, '^\d+\.\s+(.+)$', '<li>\1</li>', 'gm');

  -- wrap consecutive <li> in <ul>
  html := regexp_replace(html, '(<li>.*</li>\n?)+', '<ul>\1</ul>', 'g');

  -- paragraphs: double newline
  html := regexp_replace(html, '\n{2,}', '</p><p>', 'g');
  html := '<p>' || html || '</p>';

  -- line breaks within paragraphs
  html := regexp_replace(html, '(?<=</li>)\n(?=<li>|<)', E'\n', 'g');
  html := regexp_replace(html, '(?<!</[^>]+>)\n(?!<)', '<br/>', 'g');

  -- cleanup empty paragraphs
  html := regexp_replace(html, '<p>\s*</p>', '', 'g');

  -- images
  html := regexp_replace(html, '!\[([^\]]*)\]\(([^)]+)\)', '<img src="\2" alt="\1" />', 'g');

  -- links
  html := regexp_replace(html, '\[([^\]]+)\]\(([^)]+)\)', '<a href="\2">\1</a>', 'g');

  return html;
end;
$$;

-- Applica a tutti i post esistenti il cui contenuto sembra Markdown
update posts
set content = crude_md_to_html(content)
where content is not null
  and content !~ '^\s*<'  -- non inizia con un tag HTML
  and (
    content ~ '\*\*'
    or content ~ '^##'
    or content ~ '^###'
    or content ~ '^\* '
    or content ~ '^- '
    or content ~ '\n\['
    or content ~ '!\['
  );

drop function crude_md_to_html;
