<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pages', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('space_id')->constrained()->cascadeOnDelete();
            $table->foreignId('parent_id')->nullable()->constrained('pages')->nullOnDelete();
            $table->string('title');
            $table->string('slug');
            $table->string('emoji')->nullable();
            $table->string('type')->default('page');
            $table->string('external_url')->nullable();
            $table->unsignedInteger('position')->default(0);
            $table->boolean('is_draft')->default(false);
            $table->json('content')->nullable();
            $table->longText('content_markdown')->nullable();
            $table->timestamps();
            $table->softDeletes();
            $table->index(['space_id', 'parent_id', 'position']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pages');
    }
};
