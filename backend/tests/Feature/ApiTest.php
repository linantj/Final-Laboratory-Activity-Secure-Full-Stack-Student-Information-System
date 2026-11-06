<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class ApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_registration_creates_a_hashed_user_and_access_token(): void
    {
        $response = $this->postJson('/api/auth/register', [
            'name' => 'Ada Student',
            'email' => 'Ada@example.com',
            'password' => 'correct-horse-battery',
            'password_confirmation' => 'correct-horse-battery',
        ]);

        $response->assertCreated()
            ->assertJsonPath('user.name', 'Ada Student')
            ->assertJsonPath('user.email', 'ada@example.com')
            ->assertJsonStructure(['user' => ['id', 'name', 'email'], 'token'])
            ->assertJsonMissingPath('user.password');

        $user = User::where('email', 'ada@example.com')->firstOrFail();
        $this->assertTrue(Hash::check('correct-horse-battery', $user->password));
        $this->assertDatabaseHas('personal_access_tokens', [
            'tokenable_id' => $user->id,
            'name' => 'student-information-system',
        ]);
    }

    public function test_registration_rejects_duplicate_email_and_invalid_password_confirmation(): void
    {
        User::factory()->create(['email' => 'ada@example.com']);

        $this->postJson('/api/auth/register', [
            'name' => 'Another Student',
            'email' => 'ADA@example.com',
            'password' => 'correct-horse-battery',
            'password_confirmation' => 'not-the-same-password',
        ])->assertUnprocessable()
            ->assertJsonValidationErrors(['email', 'password']);
    }

    public function test_login_verifies_credentials_and_rejects_invalid_credentials(): void
    {
        User::factory()->create([
            'email' => 'ada@example.com',
            'password' => 'correct-horse-battery',
        ]);

        $this->postJson('/api/auth/login', [
            'email' => 'ADA@example.com',
            'password' => 'wrong-password',
        ])->assertUnprocessable()
            ->assertJsonPath('message', 'The provided credentials are incorrect.');

        $this->postJson('/api/auth/login', [
            'email' => 'ADA@example.com',
            'password' => 'correct-horse-battery',
        ])->assertOk()
            ->assertJsonPath('user.email', 'ada@example.com')
            ->assertJsonStructure(['token']);
    }

    public function test_current_user_is_protected_and_logout_revokes_the_current_token(): void
    {
        $this->getJson('/api/auth/user')->assertUnauthorized();

        $user = User::factory()->create();
        $token = $user->createToken('test')->plainTextToken;
        $tokenId = explode('|', $token, 2)[0];

        $this->withToken($token)->getJson('/api/auth/user')
            ->assertOk()
            ->assertJsonPath('user.name', $user->name)
            ->assertJsonPath('user.email', $user->email);

        $this->withToken($token)->postJson('/api/auth/logout')
            ->assertOk();

        $this->assertDatabaseMissing('personal_access_tokens', [
            'id' => $tokenId,
        ]);

        Auth::forgetGuards();

        $this->withToken($token)->getJson('/api/auth/user')
            ->assertUnauthorized();
    }

    public function test_login_is_rate_limited(): void
    {
        $request = [
            'email' => 'missing@example.com',
            'password' => 'invalid-password',
        ];

        for ($attempt = 0; $attempt < 5; $attempt++) {
            $this->withServerVariables(['REMOTE_ADDR' => '192.0.2.123'])
                ->postJson('/api/auth/login', $request)
                ->assertUnprocessable();
        }

        $this->withServerVariables(['REMOTE_ADDR' => '192.0.2.123'])
            ->postJson('/api/auth/login', $request)
            ->assertTooManyRequests();
    }

    public function test_student_sources_are_bound_to_separate_database_connections(): void
    {
        $this->assertSame('pgsql', config('students.cloud_connection'));
        $this->assertSame('local_mysql', config('students.physical_connection'));
    }

    public function test_students_endpoint_returns_rows_from_only_the_validated_source(): void
    {
        $this->getJson('/api/students?source=cloud')->assertUnauthorized();

        config([
            'students.cloud_connection' => 'sqlite',
            'students.physical_connection' => 'sqlite',
        ]);

        Schema::create('students', function ($table): void {
            $table->id();
            $table->string('name');
            $table->string('course');
        });

        DB::table('students')->insert([
            ['name' => 'Actual Cloud Row', 'course' => 'Engineering'],
        ]);

        $token = User::factory()->create()->createToken('test')->plainTextToken;

        $this->withToken($token)->getJson('/api/students?source=cloud')
            ->assertOk()
            ->assertJsonPath('source', 'cloud')
            ->assertJsonPath('count', 1)
            ->assertJsonPath('students.0.name', 'Actual Cloud Row');

        $this->withToken($token)->getJson('/api/students?source=physical')
            ->assertOk()
            ->assertJsonPath('source', 'physical')
            ->assertJsonPath('count', 1);

        $this->withToken($token)->getJson('/api/students?source=mysql')
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['source']);
    }
}
