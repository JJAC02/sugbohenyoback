CREATE VIEW user_relics AS
SELECT
r.relic_name, r.relic_id, u.user_id, u.username
    FROM user_inventory as ui
INNER JOIN relics AS r
    ON ui.relic_id = r.relic_id
INNER JOIN users AS u
    ON ui.user_id = u.user_id;