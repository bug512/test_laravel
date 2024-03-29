<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class Rubric extends Model
{
    protected $table = 'rubrics';

    protected $fillable = ['title'];

    /**
     * @return mixed
     */
    public function articles()
    {
        return $this->hasMany(Article::class);
    }
}
