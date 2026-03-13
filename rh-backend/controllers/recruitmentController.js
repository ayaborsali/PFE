import { pool } from '../config/db.js';
export const createRecruitmentRequest = async ({ title, department, description, createdBy }) => {
  const query = `
    INSERT INTO recruitment_requests
    (title, department, description, created_by, status, current_validation_level, created_at)
    VALUES ($1, $2, $3, $4, 'Open', 'Manager', NOW())
    RETURNING *;
  `;

  const values = [title, department, description, createdBy];

  try {
    const res = await pool.query(query, values);
    return res.rows[0];
  } catch (err) {
    console.error(err);
    throw new Error('Erreur lors de la création de la demande');
  }
};