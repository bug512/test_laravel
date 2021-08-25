<?php

namespace App;

use App\Scopes\RevisionScope;
use Illuminate\Database\Eloquent\Model;

class Article extends Model
{
    //
    protected $table = 'articles';

    protected $fillable = ['title', 'revision', 'description', 'short_description'];

    public function rubric()
    {
        return $this->belongsTo(Rubric::class);
    }

    public function current_revision()
    {
        return $this->belongsTo(RevDataArticle::class);
    }

    public function tags()
    {
        return $this->morphToMany(Tag::class, 'taggable');
    }

    public function comments()
    {
        return $this->hasMany(Comment::class);
    }

    public function setRevisionAttribute($value)
    {
        if (isset($this->revision)) {
            $this->attributes['revision'] = env('APP_REVISION', 'default');
        } else {
            $this->attributes['revision']  = $value;
        }
    }

    /**
     * The "booting" method of the model.
     *
     * @return void
     */
    protected static function boot()
    {
        parent::boot();

        static::addGlobalScope(new RevisionScope());
    }
}
