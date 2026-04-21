import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { Platform, TestRunStatus } from '@prisma/client'
import { QaService } from './qa.service'
import {
  CreateTestCaseDto,
  CreateTestRunDto,
  RecordTestResultDto,
  UpdateTestCaseDto,
  UpdateTestRunDto,
} from './dto/qa.dto'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'

@ApiTags('QA')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('qa')
export class QaController {
  constructor(private readonly service: QaService) {}

  /* ────────── TestCase ────────── */

  @Get('test-cases')
  @ApiOperation({ summary: 'List test cases by workItemId (optional platform filter)' })
  listTestCases(
    @Query('workItemId') workItemId: string,
    @Query('platform') platform?: Platform,
  ) {
    return this.service.findTestCases(workItemId, platform)
  }

  @Get('test-cases/:id')
  @ApiOperation({ summary: 'Get a test case with recent results' })
  findTestCase(@Param('id') id: string) {
    return this.service.findTestCase(id)
  }

  @Post('test-cases')
  @ApiOperation({ summary: 'Create a test case linked to a work item' })
  createTestCase(@Body() dto: CreateTestCaseDto) {
    return this.service.createTestCase(dto)
  }

  @Patch('test-cases/:id')
  @ApiOperation({ summary: 'Update a test case' })
  updateTestCase(@Param('id') id: string, @Body() dto: UpdateTestCaseDto) {
    return this.service.updateTestCase(id, dto)
  }

  @Delete('test-cases/:id')
  @ApiOperation({ summary: 'Delete a test case and all its results' })
  removeTestCase(@Param('id') id: string) {
    return this.service.removeTestCase(id)
  }

  /* ────────── TestRun ────────── */

  @Get('test-runs')
  @ApiOperation({ summary: 'List test runs by releaseId (optional status filter)' })
  listTestRuns(
    @Query('releaseId') releaseId: string,
    @Query('status') status?: TestRunStatus,
  ) {
    return this.service.findTestRuns(releaseId, status)
  }

  @Get('test-runs/:id')
  @ApiOperation({ summary: 'Get a test run with all results' })
  findTestRun(@Param('id') id: string) {
    return this.service.findTestRun(id)
  }

  @Post('test-runs')
  @ApiOperation({ summary: 'Create a new test run for a release' })
  createTestRun(@Body() dto: CreateTestRunDto) {
    return this.service.createTestRun(dto)
  }

  @Patch('test-runs/:id')
  @ApiOperation({ summary: 'Update test run status (auto-sets startedAt / endedAt)' })
  updateTestRun(@Param('id') id: string, @Body() dto: UpdateTestRunDto) {
    return this.service.updateTestRun(id, dto)
  }

  @Delete('test-runs/:id')
  @ApiOperation({ summary: 'Delete a test run and all its results' })
  removeTestRun(@Param('id') id: string) {
    return this.service.removeTestRun(id)
  }

  /* ────────── TestResult ────────── */

  @Post('test-runs/:runId/results')
  @ApiOperation({ summary: 'Record a test result for a specific test run' })
  recordResult(
    @Param('runId') runId: string,
    @Body() dto: RecordTestResultDto,
  ) {
    return this.service.recordResult(runId, dto)
  }

  @Get('test-runs/:runId/results')
  @ApiOperation({ summary: 'List all results of a test run' })
  listResults(@Param('runId') runId: string) {
    return this.service.findResults(runId)
  }

  @Get('test-runs/:runId/summary')
  @ApiOperation({ summary: 'Get pass/fail/skip summary for a test run' })
  getRunSummary(@Param('runId') runId: string) {
    return this.service.getRunSummary(runId)
  }

  /* ────────── Coverage ────────── */

  @Get('coverage/:projectId')
  @ApiOperation({ summary: 'Get test coverage stats for a project' })
  getCoverage(@Param('projectId') projectId: string) {
    return this.service.getProjectCoverage(projectId)
  }

  @Get('project-runs/:projectId')
  @ApiOperation({ summary: 'List all test runs for a project (via releases)' })
  listRunsByProject(@Param('projectId') projectId: string) {
    return this.service.findTestRunsByProject(projectId)
  }
}
