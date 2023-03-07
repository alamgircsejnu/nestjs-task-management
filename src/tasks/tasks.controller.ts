import { Body, Controller, Get, ParseIntPipe, Post, UseGuards, ValidationPipe } from '@nestjs/common';
import { Delete, Param, Patch, Query, UsePipes } from '@nestjs/common/decorators';
import { CreateTaskDto } from './dto/create-task.dto';
import { GetTaskFilterDto } from './dto/get-task-filter.dto';
import { TaskStatusValidationPipe } from './pipes/task-status-validation.pipe';
import { Task } from './task.entity';
import { TasksService } from './tasks.service';
import { TaskStatus } from './task-status.enum';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from '../auth/get-user.decorator';
import { User } from '../auth/user.entity';

@Controller('tasks')
@UseGuards(AuthGuard())
export class TasksController {
    constructor(private taskService: TasksService) {}

    @Get()
    getTasks(
      @Query(ValidationPipe) filterDto: GetTaskFilterDto,
      @GetUser() user: User
    ): Promise<Task[]> {
        return this.taskService.getTasks(filterDto, user);
    }

    @Get('/:id')
    getTaskById(
      @Param('id', ParseIntPipe) id: number,
      @GetUser() user: User
    ): Promise<Task> {
        console.log(id);
        return this.taskService.getTaskById(id, user);
    }

    @Post()
    @UsePipes(ValidationPipe)
    createTask(
      @Body() createTaskDto: CreateTaskDto,
      @GetUser() user: User
    ): Promise<Task> {
        return this.taskService.createTask(createTaskDto, user);
    }

    @Delete('/:id')
    deleteTask(
      @Param('id', ParseIntPipe) id: number,
      @GetUser() user: User
    ): Promise<void> {
        return this.taskService.deleteTask(id, user);
    }

    @Patch('/:id/status')
    updateTaskStatus(
      @Param('id', ParseIntPipe) id: number,
      @Body('status', TaskStatusValidationPipe) status: TaskStatus,
      @GetUser() user: User
    ): Promise<Task> {
        return this.taskService.updateTaskStatus(id, status, user);
    }

}
