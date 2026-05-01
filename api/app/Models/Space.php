<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Spatie\Sluggable\HasSlug;
use Spatie\Sluggable\SlugOptions;

class Space extends Model
{
    use HasSlug;

    protected $fillable = [
        'organization_id',
        'name',
        'slug',
        'description',
        'icon',
        'cover',
        'visibility',
        'password',
        'accent_color',
        'default_theme',
        'show_powered_by',
        'logo',
        'custom_domain',
    ];

    protected function casts(): array
    {
        return [
            'show_powered_by' => 'boolean',
            'password' => 'hashed',
        ];
    }

    public function getSlugOptions(): SlugOptions
    {
        return SlugOptions::create()
            ->generateSlugsFrom('name')
            ->saveSlugsTo('slug')
            ->doNotGenerateSlugsOnUpdate();
    }

    public function getRouteKeyName(): string
    {
        return 'slug';
    }

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    public function pages(): HasMany
    {
        return $this->hasMany(Page::class);
    }

    public function rootPages(): HasMany
    {
        return $this->hasMany(Page::class)->whereNull('parent_id')->orderBy('position');
    }
}
