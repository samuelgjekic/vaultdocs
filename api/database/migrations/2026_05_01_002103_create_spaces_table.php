<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('spaces', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('organization_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('slug');
            $table->text('description')->nullable();
            $table->string('icon')->nullable();
            $table->string('cover')->nullable();
            $table->string('visibility')->default('private');
            $table->string('password')->nullable();
            $table->string('accent_color')->nullable();
            $table->boolean('show_powered_by')->default(true);
            $table->string('logo')->nullable();
            $table->string('custom_domain')->nullable()->unique();
            $table->timestamps();
            $table->unique(['organization_id', 'slug']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('spaces');
    }
};
