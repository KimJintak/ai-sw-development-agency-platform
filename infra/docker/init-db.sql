-- pgvector 확장 활성화
CREATE EXTENSION IF NOT EXISTS vector;

-- 테스트용 DB 생성
CREATE DATABASE agency_test;

-- 테스트 DB에도 pgvector 활성화
\c agency_test
CREATE EXTENSION IF NOT EXISTS vector;
