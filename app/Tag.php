<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class Tag extends Model
{
    protected $table = 'tags';

    protected $fillable = ['title'];

    public function articles()
    {
        return $this->hasMany(Article::class);
    }
}
