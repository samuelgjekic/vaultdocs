<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Page extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'space_id',
        'parent_id',
        'title',
        'slug',
        'emoji',
        'type',
        'external_url',
        'position',
        'is_draft',
        'content',
        'content_markdown',
    ];

    protected function casts(): array
    {
        return [
            'content' => 'array',
            'is_draft' => 'boolean',
            'position' => 'integer',
        ];
    }

    public function space(): BelongsTo
    {
        return $this->belongsTo(Space::class);
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(Page::class, 'parent_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(Page::class, 'parent_id')->orderBy('position');
    }
}
