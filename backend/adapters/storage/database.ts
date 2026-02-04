/**
 * Database Storage Adapter
 * 
 * Implements StorageAdapter interface using SQLite (MVP) or PostgreSQL (production)
 * According to API Specification & DB Schema document
 */

import Database from 'better-sqlite3';
import { StorageAdapter } from './types';
import {
  Session,
  Message,
  InstructorProfile,
  LearnerMemory,
  SessionState,
  MessageRole,
  MessageType,
} from '../../core/types';

export interface DatabaseConfig {
  type: 'sqlite' | 'postgres';
  connectionString?: string; // For SQLite: file path, for Postgres: connection string
}

export class DatabaseStorageAdapter implements StorageAdapter {
  private db: Database.Database;

  constructor(config: DatabaseConfig) {
    if (config.type === 'sqlite') {
      const dbPath = config.connectionString || ':memory:';
      this.db = new Database(dbPath);
      this.initializeSchema();
    } else {
      throw new Error('PostgreSQL adapter not yet implemented');
    }
  }

  /**
   * Initialize database schema according to API spec
   */
  private initializeSchema(): void {
    // Instructors table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS instructors (
        id VARCHAR PRIMARY KEY,
        name VARCHAR NOT NULL,
        bio TEXT,
        tone VARCHAR,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Instructor profiles table (SQLite uses TEXT for JSON)
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS instructor_profiles (
        instructor_id VARCHAR PRIMARY KEY,
        explanation_style TEXT,
        analogy_patterns TEXT,
        forbidden_topics TEXT,
        curriculum_tree TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (instructor_id) REFERENCES instructors(id)
      )
    `);

    // Instructor materials table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS instructor_materials (
        id VARCHAR PRIMARY KEY,
        instructor_id VARCHAR NOT NULL,
        type VARCHAR NOT NULL,
        content_url TEXT,
        content_text TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (instructor_id) REFERENCES instructors(id)
      )
    `);

    // Learners table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS learners (
        id VARCHAR PRIMARY KEY,
        name VARCHAR NOT NULL,
        level VARCHAR,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Learner memory table (SQLite uses TEXT for JSON)
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS learner_memory (
        learner_id VARCHAR PRIMARY KEY,
        weak_concepts TEXT,
        mastered_concepts TEXT,
        explanation_depth_level INTEGER DEFAULT 2,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (learner_id) REFERENCES learners(id)
      )
    `);

    // Sessions table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS sessions (
        id VARCHAR PRIMARY KEY,
        instructor_id VARCHAR NOT NULL,
        learner_id VARCHAR NOT NULL,
        instructor_profile_id VARCHAR,
        subject VARCHAR,
        topic VARCHAR,
        learning_objective TEXT,
        session_state VARCHAR DEFAULT 'active',
        started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_activity_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ended_at TIMESTAMP,
        FOREIGN KEY (instructor_id) REFERENCES instructors(id),
        FOREIGN KEY (learner_id) REFERENCES learners(id)
      )
    `);

    // Messages table (SQLite uses TEXT for JSON)
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS messages (
        id VARCHAR PRIMARY KEY,
        session_id VARCHAR NOT NULL,
        sender VARCHAR NOT NULL,
        role VARCHAR NOT NULL,
        content TEXT NOT NULL,
        message_type VARCHAR,
        teaching_metadata TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (session_id) REFERENCES sessions(id)
      )
    `);

    // Session messages junction table (for messageIds array)
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS session_messages (
        session_id VARCHAR NOT NULL,
        message_id VARCHAR NOT NULL,
        sequence_order INTEGER NOT NULL,
        PRIMARY KEY (session_id, message_id),
        FOREIGN KEY (session_id) REFERENCES sessions(id),
        FOREIGN KEY (message_id) REFERENCES messages(id)
      )
    `);

    // Create indexes for performance
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_sessions_instructor ON sessions(instructor_id);
      CREATE INDEX IF NOT EXISTS idx_sessions_learner ON sessions(learner_id);
      CREATE INDEX IF NOT EXISTS idx_messages_session ON messages(session_id);
      CREATE INDEX IF NOT EXISTS idx_session_messages_order ON session_messages(session_id, sequence_order);
    `);
  }

  // Session operations
  async loadSession(sessionId: string): Promise<Session | null> {
    const sessionRow = this.db.prepare('SELECT * FROM sessions WHERE id = ?').get(sessionId) as any;
    if (!sessionRow) return null;

    // Load message IDs
    const messageRows = this.db
      .prepare('SELECT message_id FROM session_messages WHERE session_id = ? ORDER BY sequence_order')
      .all(sessionId) as Array<{ message_id: string }>;
    const messageIds = messageRows.map(r => r.message_id);

    return {
      id: sessionRow.id,
      instructorId: sessionRow.instructor_id,
      learnerId: sessionRow.learner_id,
      instructorProfileId: sessionRow.instructor_profile_id || sessionRow.instructor_id,
      subject: sessionRow.subject || '',
      topic: sessionRow.topic || '',
      learningObjective: sessionRow.learning_objective || '',
      sessionState: sessionRow.session_state as SessionState,
      messageIds,
      startedAt: new Date(sessionRow.started_at),
      lastActivityAt: new Date(sessionRow.last_activity_at),
      endedAt: sessionRow.ended_at ? new Date(sessionRow.ended_at) : null,
    };
  }

  async saveSession(session: Session): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO sessions (
        id, instructor_id, learner_id, instructor_profile_id,
        subject, topic, learning_objective, session_state,
        started_at, last_activity_at, ended_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      session.id,
      session.instructorId,
      session.learnerId,
      session.instructorProfileId,
      session.subject,
      session.topic,
      session.learningObjective,
      session.sessionState,
      session.startedAt.toISOString(),
      session.lastActivityAt.toISOString(),
      session.endedAt?.toISOString() || null
    );

    // Save message IDs
    const deleteStmt = this.db.prepare('DELETE FROM session_messages WHERE session_id = ?');
    deleteStmt.run(session.id);

    const insertStmt = this.db.prepare(
      'INSERT INTO session_messages (session_id, message_id, sequence_order) VALUES (?, ?, ?)'
    );
    const insertMany = this.db.transaction((messages: Array<{ id: string; order: number }>) => {
      for (const msg of messages) {
        insertStmt.run(session.id, msg.id, msg.order);
      }
    });

    insertMany(session.messageIds.map((id, idx) => ({ id, order: idx })));
  }

  async updateSession(sessionId: string, updates: Partial<Session>): Promise<void> {
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.sessionState !== undefined) {
      fields.push('session_state = ?');
      values.push(updates.sessionState);
    }
    if (updates.lastActivityAt !== undefined) {
      fields.push('last_activity_at = ?');
      values.push(updates.lastActivityAt.toISOString());
    }
    if (updates.endedAt !== undefined) {
      fields.push('ended_at = ?');
      values.push(updates.endedAt?.toISOString() || null);
    }
    if (updates.messageIds !== undefined) {
      // Delete old message IDs
      this.db.prepare('DELETE FROM session_messages WHERE session_id = ?').run(sessionId);
      // Insert new message IDs
      const insertStmt = this.db.prepare(
        'INSERT INTO session_messages (session_id, message_id, sequence_order) VALUES (?, ?, ?)'
      );
      const insertMany = this.db.transaction((messages: Array<{ id: string; order: number }>) => {
        for (const msg of messages) {
          insertStmt.run(sessionId, msg.id, msg.order);
        }
      });
      insertMany(updates.messageIds.map((id, idx) => ({ id, order: idx })));
    }

    if (fields.length > 0) {
      values.push(sessionId);
      const sql = `UPDATE sessions SET ${fields.join(', ')} WHERE id = ?`;
      this.db.prepare(sql).run(...values);
    }
  }

  // Message operations
  async loadMessage(messageId: string): Promise<Message | null> {
    const row = this.db.prepare('SELECT * FROM messages WHERE id = ?').get(messageId) as any;
    if (!row) return null;

    return {
      id: row.id,
      sessionId: row.session_id,
      role: row.role as MessageRole,
      content: row.content,
      messageType: (row.message_type || 'question') as MessageType,
      teachingMetadata: row.teaching_metadata ? JSON.parse(row.teaching_metadata) : undefined,
      timestamp: new Date(row.created_at),
    };
  }

  async loadMessages(messageIds: string[]): Promise<Message[]> {
    if (messageIds.length === 0) return [];

    const placeholders = messageIds.map(() => '?').join(',');
    const rows = this.db
      .prepare(`SELECT * FROM messages WHERE id IN (${placeholders}) ORDER BY created_at`)
      .all(...messageIds) as any[];

    return rows.map(row => ({
      id: row.id,
      sessionId: row.session_id,
      role: row.role as MessageRole,
      content: row.content,
      messageType: (row.message_type || 'question') as MessageType,
      teachingMetadata: row.teaching_metadata ? JSON.parse(row.teaching_metadata) : undefined,
      timestamp: new Date(row.created_at),
    }));
  }

  async saveMessage(message: Message): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT INTO messages (
        id, session_id, sender, role, content, message_type, teaching_metadata, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      message.id,
      message.sessionId,
      message.role === 'instructor' ? 'ai' : 'learner',
      message.role,
      message.content,
      message.messageType,
      message.teachingMetadata ? JSON.stringify(message.teachingMetadata) : null,
      message.timestamp.toISOString()
    );
  }

  // Instructor profile operations
  async loadInstructorProfile(profileId: string): Promise<InstructorProfile | null> {
    // Try to load from instructor_profiles table first
    let row = this.db
      .prepare('SELECT * FROM instructor_profiles WHERE instructor_id = ?')
      .get(profileId) as any;

    if (!row) {
      // Fallback: try to load from instructors table
      row = this.db.prepare('SELECT * FROM instructors WHERE id = ?').get(profileId) as any;
      if (!row) return null;

      // Create a basic profile from instructor data
      return {
        id: row.id,
        instructorId: row.id,
        name: row.name,
        teachingPatterns: [],
        guidanceStyle: row.tone || 'friendly',
        responseStructure: 'structured',
        questionPatterns: [],
        correctionStyle: 'gentle',
        consistencySettings: {},
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.created_at),
      };
    }

    return {
      id: row.instructor_id,
      instructorId: row.instructor_id,
      name: '', // Will be loaded from instructors table if needed
      teachingPatterns: row.explanation_style ? JSON.parse(row.explanation_style) : [],
      guidanceStyle: row.analogy_patterns ? JSON.parse(row.analogy_patterns).style : 'friendly',
      responseStructure: 'structured',
      questionPatterns: [],
      correctionStyle: 'gentle',
      consistencySettings: {
        forbiddenTopics: row.forbidden_topics ? JSON.parse(row.forbidden_topics) : [],
        curriculumTree: row.curriculum_tree ? JSON.parse(row.curriculum_tree) : {},
      },
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.created_at),
    };
  }

  // Learner memory operations
  async loadLearnerMemory(learnerId: string): Promise<LearnerMemory | null> {
    const row = this.db
      .prepare('SELECT * FROM learner_memory WHERE learner_id = ?')
      .get(learnerId) as any;

    if (!row) {
      // Return default empty memory
      return {
        learnerId,
        learnedConcepts: [],
        misconceptions: [],
        strengths: [],
        weaknesses: [],
        progressMarkers: [],
        sessionSummaries: [],
        lastUpdated: new Date(),
      };
    }

    const weakConcepts = row.weak_concepts ? JSON.parse(row.weak_concepts) : [];
    const masteredConcepts = row.mastered_concepts ? JSON.parse(row.mastered_concepts) : [];

    return {
      learnerId: row.learner_id,
      learnedConcepts: masteredConcepts.map((c: string) => ({
        concept: c,
        masteryLevel: 'mastered' as const,
        firstIntroducedAt: new Date(),
        lastPracticedAt: new Date(),
      })),
      misconceptions: [],
      strengths: [],
      weaknesses: weakConcepts,
      progressMarkers: [],
      sessionSummaries: [],
      lastUpdated: new Date(row.updated_at),
    };
  }

  async saveLearnerMemory(memory: LearnerMemory): Promise<void> {
    const weakConcepts = memory.weaknesses || [];
    const masteredConcepts = memory.learnedConcepts
      .filter(c => c.masteryLevel === 'mastered')
      .map(c => c.concept);

    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO learner_memory (
        learner_id, weak_concepts, mastered_concepts, explanation_depth_level, updated_at
      ) VALUES (?, ?, ?, ?, ?)
    `);

    stmt.run(
      memory.learnerId,
      JSON.stringify(weakConcepts),
      JSON.stringify(masteredConcepts),
      2, // Default explanation depth
      memory.lastUpdated.toISOString()
    );
  }

  // Additional helper methods for API endpoints
  async createInstructor(data: {
    id: string;
    name: string;
    bio?: string;
    tone?: string;
  }): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT INTO instructors (id, name, bio, tone) VALUES (?, ?, ?, ?)
    `);
    stmt.run(data.id, data.name, data.bio || null, data.tone || 'friendly');
  }

  async createLearner(data: {
    id: string;
    name: string;
    level?: string;
  }): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT INTO learners (id, name, level) VALUES (?, ?, ?)
    `);
    stmt.run(data.id, data.name, data.level || 'beginner');
  }

  async saveInstructorMaterial(data: {
    id: string;
    instructorId: string;
    type: string;
    contentUrl?: string;
    contentText?: string;
  }): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT INTO instructor_materials (id, instructor_id, type, content_url, content_text)
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run(data.id, data.instructorId, data.type, data.contentUrl || null, data.contentText || null);
  }

  close(): void {
    this.db.close();
  }
}
